import express from 'express';
import mercadoPagoService, { WithdrawalResponse } from '../services/mercadoPagoService';
import { User, PurchaseRecord } from '../models';

const router = express.Router();

/**
 * Webhook do Mercado Pago - recebe notificações de pagamentos
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
