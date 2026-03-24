// Cron Job para Verificação Automática de Saques Pendentes
// Executa a cada 5 minutos para verificar status dos saques no Mercado Pago

import cron from 'node-cron';
import axios from 'axios';
import { User } from '../models';
import mercadoPagoService from '../services/mercadoPagoService';
import { getIO } from '../socket';

class WithdrawalCronJob {
    private static instance: WithdrawalCronJob;
    private io = getIO();

    private constructor() {
        this.initializeCronJobs();
        console.log('⏰ [CRON] Sistema de verificação automática de saques inicializado');
    }

    static getInstance(): WithdrawalCronJob {
        if (!WithdrawalCronJob.instance) {
            WithdrawalCronJob.instance = new WithdrawalCronJob();
        }
        return WithdrawalCronJob.instance;
    }

    private initializeCronJobs(): void {
        // Executar a cada 5 minutos
        cron.schedule('*/5 * * * *', async () => {
            await this.checkPendingWithdrawals();
        });

        // Executar a cada hora para relatório
        cron.schedule('0 * * * *', async () => {
            await this.generateHourlyReport();
        });

        // Executar diariamente à meia-noite para limpeza
        cron.schedule('0 0 * * *', async () => {
            await this.dailyCleanup();
        });
    }

    /**
     * Verifica saques pendentes no Mercado Pago
     */
    private async checkPendingWithdrawals(): Promise<void> {
        try {
            console.log('⏰ [CRON] Iniciando verificação de saques pendentes...');

            const pendingWithdrawals = await User.find({
                'withdrawal_requests.status': 'pending'
            });

            if (pendingWithdrawals.length === 0) {
                console.log('⏰ [CRON] Nenhum saque pendente encontrado');
                return;
            }

            console.log(`⏰ [CRON] Encontrados ${pendingWithdrawals.length} usuários com saques pendentes`);

            let updatedCount = 0;
            let rejectedCount = 0;

            for (const user of pendingWithdrawals) {
                for (const withdrawal of user.withdrawal_requests || []) {
                    if (withdrawal.status === 'pending' && withdrawal.mp_payment_id) {
                        try {
                            const status = await mercadoPagoService.getPaymentStatus(withdrawal.mp_payment_id);
                            
                            if (status.status === 'approved') {
                                // Atualizar status para completed
                                await User.updateOne(
                                    { id: user.id, 'withdrawal_requests.mp_payment_id': withdrawal.mp_payment_id },
                                    { 'withdrawal_requests.$.status': 'completed' }
                                );
                                
                                updatedCount++;
                                
                                // Notificar usuário via WebSocket
                                this.io.emit('withdrawal_approved', {
                                    userId: user.id,
                                    amount: withdrawal.amount,
                                    mercadoPagoId: withdrawal.mp_payment_id,
                                    timestamp: new Date()
                                });
                                
                                console.log(`✅ [CRON] Saque aprovado: User=${user.id}, Amount=${withdrawal.amount}`);
                                
                            } else if (status.status === 'rejected' || status.status === 'cancelled') {
                                // Devolver dinheiro ao usuário se rejeitado
                                await User.updateOne(
                                    { id: user.id, 'withdrawal_requests.mp_payment_id': withdrawal.mp_payment_id },
                                    { 
                                        $inc: { earnings: withdrawal.amount },
                                        'withdrawal_requests.$.status': 'failed'
                                    }
                                );
                                
                                rejectedCount++;
                                
                                // Notificar usuário sobre rejeição
                                this.io.emit('withdrawal_rejected', {
                                    userId: user.id,
                                    amount: withdrawal.amount,
                                    mercadoPagoId: withdrawal.mp_payment_id,
                                    timestamp: new Date()
                                });
                                
                                console.log(`❌ [CRON] Saque rejeitado, valor devolvido: User=${user.id}, Amount=${withdrawal.amount}`);
                            }
                        } catch (error) {
                            console.error(`❌ [CRON] Erro ao verificar saque ${withdrawal.mp_payment_id}:`, error);
                        }
                    }
                }
            }

            console.log(`⏰ [CRON] Verificação concluída: ${updatedCount} aprovados, ${rejectedCount} rejeitados`);

        } catch (error) {
            console.error('❌ [CRON] Erro na verificação de saques pendentes:', error);
        }
    }

    /**
     * Gera relatório horário das transações
     */
    private async generateHourlyReport(): Promise<void> {
        try {
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

            const [approvedCount, rejectedCount, pendingCount] = await Promise.all([
                User.countDocuments({ 'withdrawal_requests.status': 'completed', 'withdrawal_requests.timestamp': { $gte: oneHourAgo } }),
                User.countDocuments({ 'withdrawal_requests.status': 'failed', 'withdrawal_requests.timestamp': { $gte: oneHourAgo } }),
                User.countDocuments({ 'withdrawal_requests.status': 'pending' })
            ]);

            console.log(`📊 [CRON] Relatório horário (${now.toISOString()}):`);
            console.log(`   ✅ Aprovados: ${approvedCount}`);
            console.log(`   ❌ Rejeitados: ${rejectedCount}`);
            console.log(`   ⏳ Pendentes: ${pendingCount}`);

        } catch (error) {
            console.error('❌ [CRON] Erro ao gerar relatório horário:', error);
        }
    }

    /**
     * Limpeza diária de registros antigos
     */
    private async dailyCleanup(): Promise<void> {
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            // Limpar histórico de compras antigo (manter apenas 30 dias)
            await User.updateMany(
                {},
                { 
                    $pull: {
                        purchase_history: { timestamp: { $lt: thirtyDaysAgo } },
                        gift_sent: { timestamp: { $lt: thirtyDaysAgo } },
                        gift_received: { timestamp: { $lt: thirtyDaysAgo } }
                    }
                }
            );

            console.log('🧹 [CRON] Limpeza diária concluída: registros antigos removidos');

        } catch (error) {
            console.error('❌ [CRON] Erro na limpeza diária:', error);
        }
    }

    /**
     * Inicia manualmente a verificação (para testes)
     */
    async triggerManualCheck(): Promise<void> {
        console.log('🔧 [CRON] Disparando verificação manual...');
        await this.checkPendingWithdrawals();
    }
}

// Exportar instância singleton
export const withdrawalCronJob = WithdrawalCronJob.getInstance();
