
import { api } from './api';
import { User } from '@/types';

interface ItemDetails {
    diamonds: number;
    price: number;
}

// Este serviço orquestra o fluxo de pagamento, utilizando as funções base da api.ts.
// Isso separa a lógica específica do provedor de pagamento das chamadas genéricas da API.

/**
 * Passo 1: Criar uma preferência de pagamento.
 * Simula uma chamada ao Mercado Pago para obter um ID de sessão de pagamento.
 */
const createPreference = async (item: ItemDetails): Promise<{ preferenceId: string }> => {
    // Em um aplicativo real, isso formataria o payload especificamente para o Mercado Pago
    // e poderia chamar um endpoint de backend dedicado que se comunica de forma segura com o Mercado Pago.
    // Por enquanto, usamos nosso endpoint de mock genérico.
    console.log('[MercadoPago Service] Criando preferência...');
    const response = await api.mercadopago.createPreference(item);
    console.log('[MercadoPago Service] Preferência criada:', response.preferenceId);
    return response;
};

/**
 * Passo 2: Finalizar a transação após o pagamento simulado.
 * Em um aplicativo real, isso seria acionado por um webhook do Mercado Pago.
 * Aqui, simulamos isso chamando nosso endpoint de confirmação diretamente após um atraso.
 */
const finalizeTransaction = async (details: ItemDetails, method: string): Promise<{ success: boolean; user: User } | null> => {
    console.log('[MercadoPago Service] Finalizando transação...');
    // A função `api.confirmPurchaseTransaction` já simula a adição de diamantes e o retorno do usuário.
    const result = await api.confirmPurchaseTransaction(details, method);
    
    // A API de mock retorna um array, então lidamos com isso.
    if (result && result.length > 0 && result[0].success) {
        console.log('[MercadoPago Service] Transação bem-sucedida. Usuário atualizado.');
        return result[0];
    }
    
    console.error('[MercadoPago Service] Falha na finalização da transação.');
    return null;
};

export const mercadoPagoService = {
    createPreference,
    finalizeTransaction,
};