import express from 'express';
import mercadoPagoService, { WithdrawalResponse } from '../services/mercadoPagoService';
import { User, PurchaseRecord, Order } from '../models';
import axios from 'axios';

const router = express.Router();

/**
 * Webhook específico para pagamentos de compras (Pix)
 */
router.post('/webhook/purchase', async (req, res) => {
  try {
    console.log('🔔 [WEBHOOK PURCHASE] Notificação recebida:', JSON.stringify(req.body, null, 2));

    const { type, data } = req.body;

    if (type === 'payment') {
      const paymentId = data.id;
      
      // Buscar informações do pagamento no Mercado Pago
      const payment = await mercadoPagoService.getPaymentStatus(paymentId);
      console.log(`💳 [WEBHOOK PURCHASE] Status do pagamento ${paymentId}:`, payment.status);
      
      // Buscar ordem pela referência externa
      const order = await Order.findOne({ externalReference: payment.external_reference });
      
      if (!order) {
        console.log(`❌ [WEBHOOK PURCHASE] Ordem não encontrada para external_reference: ${payment.external_reference}`);
        return res.status(404).json({ error: 'Order not found' });
      }

      console.log(`📋 [WEBHOOK PURCHASE] Ordem encontrada: ${order.id}, Status: ${order.status}`);

      // Verificar se o pagamento foi aprovado e a ordem ainda está pendente
      if (payment.status === 'approved' && order.status === 'pending') {
        console.log(`✅ [WEBHOOK PURCHASE] Pagamento aprovado! Processando ordem ${order.id}`);

        // Atualizar status da ordem
        order.status = 'paid';
        order.paymentConfirmationId = paymentId;
        order.mpPaymentId = paymentId;
        order.confirmedAt = new Date();
        await order.save();

        // Creditar diamantes para o usuário (FLUXO 1: ENTRADA DE VALOR)
        const user = await User.findOneAndUpdate(
          { id: order.userId },
          { 
            $inc: { diamonds: order.diamonds },
            $push: {
              purchase_history: {
                timestamp: new Date(),
                amount: order.amount,
                diamonds: order.diamonds,
                paymentId: paymentId,
                description: `Compra de ${order.diamonds} diamantes via Mercado Pago`,
                status: 'completed'
              }
            }
          },
          { new: true }
        );

        if (!user) {
          console.log(`❌ [WEBHOOK PURCHASE] Usuário não encontrado: ${order.userId}`);
          return res.status(404).json({ error: 'User not found' });
        }

        console.log(`💎 [WEBHOOK PURCHASE] Usuário ${user.name} recebeu ${order.diamonds} diamantes. Saldo atual: ${user.diamonds}`);

        // Registrar compra no histórico
        await PurchaseRecord.create({
          id: `purchase_${order.id}_${Date.now()}`,
          userId: order.userId,
          type: 'diamond_purchase',
          description: `Compra de ${order.diamonds} diamantes - Pagamento Pix: ${paymentId}`,
          amountBRL: order.amount,
          amountCoins: order.diamonds,
          status: 'Concluído',
          timestamp: new Date()
        });

        // Emitir WebSocket para atualização em tempo real
        const io = req.app.get('io');
        if (io) {
          io.to(order.userId).emit('purchase_completed', {
            orderId: order.id,
            diamonds: order.diamonds,
            amount: order.amount,
            newBalance: user.diamonds
          });

          io.to(order.userId).emit('diamonds_updated', {
            diamonds: user.diamonds,
            change: order.diamonds
          });
        }

        console.log(`🎉 [WEBHOOK PURCHASE] Compra concluída com sucesso! Ordem: ${order.id}`);
      } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
        console.log(`❌ [WEBHOOK PURCHASE] Pagamento rejeitado/cancelado: ${paymentId}`);
        
        // Atualizar status da ordem
        order.status = payment.status === 'rejected' ? 'failed' : 'cancelled';
        order.paymentConfirmationId = paymentId;
        order.mpPaymentId = paymentId;
        await order.save();
      } else {
        console.log(`⏳ [WEBHOOK PURCHASE] Pagamento em processamento: ${payment.status}`);
      }
    }

    res.status(200).json({ received: true });

  } catch (error: any) {
    console.error('❌ [WEBHOOK PURCHASE] Erro ao processar notificação:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Webhook do Mercado Pago - recebe notificações de saques
 */
router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    console.log(`🔔 [WEBHOOK] Notificação recebida:`, { type, data });

    if (type === 'payment') {
      const paymentId = data.id;
      
      // Buscar informações do pagamento
      const payment = await mercadoPagoService.getPaymentStatus(paymentId);
      
      console.log(`💳 [WEBHOOK] Status do pagamento ${paymentId}:`, payment.status);
      
      // Buscar usuário pelo external_reference
      const user = await User.findOne({ 
        'withdrawal_requests.external_reference': payment.external_reference 
      });
      
      if (user && user.withdrawal_requests) {
        // Atualizar status do saque
        const withdrawalRequest = user.withdrawal_requests.find(
          (req: any) => req.external_reference === payment.external_reference
        );
        
        if (withdrawalRequest) {
          withdrawalRequest.status = payment.status as 'pending' | 'approved' | 'rejected' | 'cancelled';
          withdrawalRequest.mp_payment_id = paymentId;
          withdrawalRequest.approved_at = payment.date_approved;
          withdrawalRequest.net_amount = payment.net_amount;
          withdrawalRequest.fee_amount = payment.fee_amount;
          
          await user.save();
          
          console.log(`✅ [WEBHOOK] Saque atualizado para usuário ${user.name}:`, {
            status: payment.status,
            amount: payment.net_amount
          });
          
          // Emitir WebSocket para atualização em tempo real
          const io = req.app.get('io');
          if (io) {
            io.to(user.id).emit('withdrawal_status_updated', {
              external_reference: payment.external_reference || '',
              status: payment.status,
              net_amount: payment.net_amount,
              approved_at: payment.date_approved
            });
          }
        }
      }
    }

    res.status(200).json({ received: true });

  } catch (error: any) {
    console.error('❌ [WEBHOOK] Erro ao processar notificação:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint de notificação alternativa (compatibilidade)
 */
router.post('/notification', async (req, res) => {
  try {
    // Processar notificação com mesma lógica do webhook
    const { type, data } = req.body;
    
    console.log(`🔔 [NOTIFICATION] Notificação recebida:`, { type, data });

    if (type === 'payment') {
      const paymentId = data.id;
      
      // Buscar informações do pagamento
      const payment = await mercadoPagoService.getPaymentStatus(paymentId);
      
      console.log(`💳 [NOTIFICATION] Status do pagamento ${paymentId}:`, payment.status);
      
      // Buscar usuário pelo external_reference
      const user = await User.findOne({ 
        'withdrawal_requests.external_reference': payment.external_reference 
      });
      
      if (user && user.withdrawal_requests) {
        // Atualizar status do saque
        const withdrawalRequest = user.withdrawal_requests.find(
          (req: any) => req.external_reference === payment.external_reference
        );
        
        if (withdrawalRequest) {
          withdrawalRequest.status = payment.status as 'pending' | 'approved' | 'rejected' | 'cancelled';
          withdrawalRequest.mp_payment_id = paymentId;
          withdrawalRequest.approved_at = payment.date_approved;
          withdrawalRequest.net_amount = payment.net_amount;
          withdrawalRequest.fee_amount = payment.fee_amount;
          
          await user.save();
          
          console.log(`✅ [NOTIFICATION] Saque atualizado para usuário ${user.name}:`, {
            status: payment.status,
            amount: payment.net_amount
          });
          
          // Emitir WebSocket para atualização em tempo real
          const io = req.app.get('io');
          if (io) {
            io.to(user.id).emit('withdrawal_status_updated', {
              external_reference: payment.external_reference || '',
              status: payment.status,
              net_amount: payment.net_amount,
              approved_at: payment.date_approved
            });
          }
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('❌ [NOTIFICATION] Erro ao processar notificação:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Verifica status de um pagamento Pix
 */
router.get('/pix/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Buscar ordem no banco
    const order = await Order.findOne({ id: orderId });
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }

    // Se não tem mpPaymentId, ainda não foi gerado o Pix
    if (!order.mpPaymentId) {
      return res.json({
        success: true,
        status: 'pending',
        message: 'Pix ainda não gerado',
        order: {
          id: order.id,
          status: order.status,
          amount: order.amount,
          diamonds: order.diamonds
        }
      });
    }

    // Verificar status no Mercado Pago
    const payment = await mercadoPagoService.getPaymentStatus(order.mpPaymentId);
    
    // Atualizar status da ordem se necessário
    if (payment.status !== order.status) {
      order.status = payment.status === 'approved' ? 'paid' : 
                    payment.status === 'rejected' ? 'failed' : 
                    payment.status === 'cancelled' ? 'cancelled' : 'pending';
      
      if (payment.status === 'approved') {
        order.paymentConfirmationId = payment.id;
        order.confirmedAt = new Date();
      }
      
      await order.save();
    }

    res.json({
      success: true,
      status: payment.status,
      order: {
        id: order.id,
        status: order.status,
        amount: order.amount,
        diamonds: order.diamonds,
        confirmedAt: order.confirmedAt
      },
      payment: {
        id: payment.id,
        status: payment.status,
        date_approved: payment.date_approved,
        transaction_amount: payment.transaction_amount
      }
    });

  } catch (error: any) {
    console.error('❌ [PIX STATUS] Erro ao verificar status:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Verifica status de um saque
 */
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await mercadoPagoService.getPaymentStatus(paymentId);
    
    res.json({
      success: true,
      payment
    });

  } catch (error: any) {
    console.error('❌ [STATUS] Erro ao verificar status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Verifica configuração do Mercado Pago
 */
router.get('/config', async (req, res) => {
  try {
    const config = mercadoPagoService.getConfigInfo();
    const isConfigured = mercadoPagoService.isConfigured();
    
    res.json({
      configured: isConfigured,
      config,
      webhook_url: process.env.WEBHOOK_URL,
      notification_url: process.env.NOTIFICATION_URL
    });

  } catch (error: any) {
    console.error('❌ [CONFIG] Erro ao verificar configuração:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
