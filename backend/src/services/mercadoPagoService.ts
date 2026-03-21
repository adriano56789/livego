import axios from 'axios';

export interface WithdrawalRequest {
  amount: number;
  description: string;
  external_reference: string;
  payer_email: string;
}

export interface WithdrawalResponse {
  id: string;
  status: string;
  amount: number;
  date_created: string;
  date_approved?: string;
  transaction_amount: number;
  net_amount: number;
  fee_amount: number;
  external_reference?: string;
}

class MercadoPagoService {
  private accessToken: string;
  private clientId: string;
  private clientSecret: string;
  private isProduction: boolean;

  constructor() {
    this.accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
    this.clientId = process.env.MERCADO_PAGO_CLIENT_ID || '';
    this.clientSecret = process.env.MERCADO_PAGO_CLIENT_SECRET || '';
    
    // Verificar se está em produção (acess token não começa com TEST-)
    this.isProduction = !this.accessToken.startsWith('TEST-');
    
    console.log(`🔧 [MERCADO_PAGO] Modo: ${this.isProduction ? 'PRODUÇÃO' : 'TESTE'}`);
    console.log(`🔧 [MERCADO_PAGO] Access Token: ${this.accessToken.substring(0, 10)}...`);
  }

  /**
   * Realiza transferência para conta Mercado Pago do usuário
   */
  async makeWithdrawal(request: WithdrawalRequest): Promise<WithdrawalResponse> {
    try {
      console.log(`💸 [MERCADO_PAGO] Iniciando saque real:`);
      console.log(`   Valor: R$ ${request.amount.toFixed(2)}`);
      console.log(`   Email: ${request.payer_email}`);
      console.log(`   Descrição: ${request.description}`);
      console.log(`   Ref: ${request.external_reference}`);

      // Para saques reais, usamos a API de pagamentos (transferência para conta MP)
      const paymentData = {
        transaction_amount: request.amount,
        description: request.description,
        payment_method_id: 'account_money', // Transferência para conta MP
        payer: {
          email: request.payer_email,
        },
        external_reference: request.external_reference,
        statement_descriptor: 'LiveGo Saque',
        notification_url: process.env.NOTIFICATION_URL,
        webhook_url: process.env.WEBHOOK_URL,
      };

      const response = await axios.post(
        'https://api.mercadopago.com/v1/payments',
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': `${request.external_reference}-${Date.now()}`
          }
        }
      );

      const payment = response.data;
      
      console.log(`✅ [MERCADO_PAGO] Saque criado com sucesso:`);
      console.log(`   ID: ${payment.id}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Valor líquido: R$ ${(payment.transaction_amount - (payment.fee_details || []).reduce((sum: number, fee: any) => sum + fee.amount, 0)).toFixed(2)}`);

      return {
        id: payment.id,
        status: payment.status,
        amount: payment.transaction_amount,
        date_created: payment.date_created,
        date_approved: payment.date_approved,
        transaction_amount: payment.transaction_amount,
        net_amount: payment.transaction_amount - (payment.fee_details || []).reduce((sum: number, fee: any) => sum + fee.amount, 0),
        fee_amount: (payment.fee_details || []).reduce((sum: number, fee: any) => sum + fee.amount, 0),
        external_reference: payment.external_reference
      };

    } catch (error: any) {
      console.error('❌ [MERCADO_PAGO] Erro ao processar saque:', error.response?.data || error.message);
      
      if (error.response?.data) {
        const mpError = error.response.data;
        throw new Error(`Mercado Pago: ${mpError.message || mpError.cause || 'Erro desconhecido'}`);
      }
      
      throw new Error('Falha na comunicação com Mercado Pago');
    }
  }

  /**
   * Verifica status de um pagamento
   */
  async getPaymentStatus(paymentId: string): Promise<WithdrawalResponse> {
    try {
      const response = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      const payment = response.data;
      
      return {
        id: payment.id,
        status: payment.status,
        amount: payment.transaction_amount,
        date_created: payment.date_created,
        date_approved: payment.date_approved,
        transaction_amount: payment.transaction_amount,
        net_amount: payment.transaction_amount - (payment.fee_details || []).reduce((sum: number, fee: any) => sum + fee.amount, 0),
        fee_amount: (payment.fee_details || []).reduce((sum: number, fee: any) => sum + fee.amount, 0),
        external_reference: payment.external_reference
      };

    } catch (error: any) {
      console.error('❌ [MERCADO_PAGO] Erro ao verificar status:', error.response?.data || error.message);
      throw new Error('Falha ao verificar status do pagamento');
    }
  }

  /**
   * Cancela um pagamento pendente
   */
  async cancelPayment(paymentId: string): Promise<boolean> {
    try {
      await axios.put(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        { status: 'cancelled' },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      console.log(`✅ [MERCADO_PAGO] Pagamento ${paymentId} cancelado`);
      return true;

    } catch (error: any) {
      console.error('❌ [MERCADO_PAGO] Erro ao cancelar pagamento:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Verifica se serviço está configurado corretamente
   */
  isConfigured(): boolean {
    return !!(this.accessToken && this.clientId && this.clientSecret);
  }

  /**
   * Retorna informações de configuração
   */
  getConfigInfo() {
    return {
      isProduction: this.isProduction,
      hasAccessToken: !!this.accessToken,
      hasClientId: !!this.clientId,
      hasClientSecret: !!this.clientSecret,
      accessTokenPrefix: this.accessToken.substring(0, 10) + '...'
    };
  }
}

export default new MercadoPagoService();
