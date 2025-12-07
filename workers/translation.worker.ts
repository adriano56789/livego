// Tipagem para o contexto do worker
declare function importScripts(...urls: string[]): void;

// Tipagem para a mensagem do worker
export interface TranslationMessage {
  id: string | number;
  message: string;
  translatedText?: string;
  [key: string]: any;
}

// Interface para a resposta da API de tradução
interface TranslationResponse {
  translatedText: string;
  originalText: string;
  from: string;
  to: string;
}

// Importa o serviço de API globalmente no worker
// Permite o uso de api.translate() em qualquer lugar do worker
importScripts('/services/api.ts');

// Função para chamar a API de tradução usando o serviço de API
declare const api: any; // Declaração do tipo para o objeto api importado

const translateText = async (text: string, targetLang: string): Promise<string> => {
  try {
    const response = await api.translate(text, targetLang);
    return response.translatedText;
  } catch (error) {
    console.error('Erro ao traduzir texto:', error);
    throw error;
  }
};

// Função principal do worker
const processTranslationBatch = async (messages: TranslationMessage[], language: string): Promise<TranslationMessage[]> => {
  const batchSize = 5;
  const results: TranslationMessage[] = [];
  
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    const batchPromises = batch.map(async (msg) => {
      try {
        if (typeof msg.message === 'string' && msg.message.trim() !== '') {
          const translatedText = await translateText(msg.message, language);
          return {
            ...msg,
            translatedText
          };
        }
        return msg;
      } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        return msg;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Envia atualizações parciais
    (self as any).postMessage({
      type: 'PARTIAL_RESULT',
      data: batchResults,
    });
  }
  
  return results;
};

// Tipagem para a mensagem recebida pelo worker
interface WorkerMessageEvent<T = any> extends MessageEvent {
  data: {
    type: string;
    payload: T;
  };
}

// Configuração do worker
(self as any).onmessage = async (e: WorkerMessageEvent<{ messages: TranslationMessage[]; language: string }>) => {
  const { type, payload } = e.data;
  
  if (type === 'TRANSLATE') {
    try {
      const { messages, language } = payload;
      const results = await processTranslationBatch(messages, language);
      
      // Envia o resultado final
      (self as any).postMessage({
        type: 'TRANSLATION_COMPLETE',
        data: results,
      });
    } catch (error) {
      (self as any).postMessage({
        type: 'TRANSLATION_ERROR',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }
};

// Exporta os tipos para uso externo
export type { TranslationResponse };

