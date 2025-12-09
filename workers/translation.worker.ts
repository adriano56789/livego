// Tipagem para o contexto do worker
/// <reference lib="webworker" />

declare const self: WorkerGlobalScope;
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

const translateText = async (text: string, targetLang: string, retryCount = 0): Promise<string> => {
  if (!text || typeof text !== 'string') return text;
  
  const cacheKey = `${targetLang}:${text}`;
  const cached = translationCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp < CACHE_EXPIRY)) {
    return cached.text;
  }

  try {
    const response = await api.translate(text, targetLang);
    const translatedText = response?.translatedText || text;
    
    // Armazena no cache
    translationCache.set(cacheKey, {
      text: translatedText,
      timestamp: Date.now()
    });
    
    return translatedText;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      // Espera um tempo exponencial antes de tentar novamente
      const delay = Math.pow(2, retryCount) * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
      return translateText(text, targetLang, retryCount + 1);
    }
    
    console.warn('Falha ao traduzir após várias tentativas:', error);
    return text; // Retorna o texto original em caso de falha
  }
};

// Configurações de desempenho otimizadas
const BATCH_SIZE = 5; // Aumentado para processar mais mensagens por lote
const BATCH_DELAY_MS = 50; // Aumentado para dar mais tempo entre lotes
const MAX_RETRIES = 2; // Número máximo de tentativas por tradução
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutos de cache
const YIELD_INTERVAL = 16; // ~60fps (1000ms/60fps ≈ 16ms)
const MAX_TASK_TIME = 15; // Tempo máximo por tarefa antes de ceder o controle

// Cache simples para traduções
const translationCache = new Map<string, { text: string; timestamp: number }>();

// Limpa o cache de forma assíncrona para não bloquear o event loop
const cleanupCache = async () => {
  const startTime = performance.now();
  const now = Date.now();
  const entries = Array.from(translationCache.entries());
  
  for (const [key, value] of entries) {
    if (now - value.timestamp > CACHE_EXPIRY) {
      translationCache.delete(key);
    }
    
    // Verifica se passou do tempo máximo e libera o event loop
    if (performance.now() - startTime > MAX_TASK_TIME) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  // Agenda a próxima limpeza
  setTimeout(cleanupCache, CACHE_EXPIRY);
};

// Inicia a limpeza do cache
setTimeout(cleanupCache, CACHE_EXPIRY);

// Função para processar um único lote com atraso
const processBatchWithDelay = async (
  batch: TranslationMessage[], 
  language: string,
  onBatchComplete: (results: TranslationMessage[]) => void
) => {
  const startTime = performance.now();
  try {
    // Filtra mensagens vazias ou inválidas
    const validMessages = batch.filter(msg => 
      msg && typeof msg.message === 'string' && msg.message.trim() !== ''
    );

    // Processa as mensagens em paralelo com limitação de concorrência
    const results = [];
    for (let i = 0; i < validMessages.length; i += 2) {
      const chunk = validMessages.slice(i, i + 2);
      const chunkResults = await Promise.all(
        chunk.map(async (msg) => {
          try {
            const translatedText = await translateText(msg.message, language);
            return { ...msg, translatedText };
          } catch (error) {
            console.warn('Erro ao traduzir mensagem:', error);
            return { ...msg, translationError: true };
          }
        })
      );
      
      // Notifica o progresso a cada chunk processado
      onBatchComplete(chunkResults);
      
      // Verifica se precisa ceder o controle para evitar bloqueio
      if (performance.now() - startTime > YIELD_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      results.push(...chunkResults);
    }
    
    return results;
  } catch (error) {
    console.error('Erro crítico no processamento do lote:', error);
    // Retorna as mensagens originais em caso de erro crítico
    return batch.map(msg => ({
      ...msg,
      translationError: true
    }));
  }
};

// Função principal do worker
const processTranslationBatch = async (
  messages: TranslationMessage[], 
  language: string,
  onProgress: (results: TranslationMessage[]) => void
): Promise<TranslationMessage[]> => {
  if (!messages || !messages.length) return [];
  
  // Remove duplicatas baseadas no ID da mensagem
  const uniqueMessages = Array.from(new Map(messages.map(msg => [msg.id, msg])).values());
  
  // Filtra mensagens que já foram traduzidas
  const untranslatedMessages = uniqueMessages.filter(msg => 
    !msg.translatedText && !msg.translationError
  );
  
  // Se todas as mensagens já foram traduzidas, retorna imediatamente
  if (untranslatedMessages.length === 0) {
    return uniqueMessages;
  }
  
  // Processa as mensagens em lotes
  const results = [];
  for (let i = 0; i < untranslatedMessages.length; i += BATCH_SIZE) {
    const batch = untranslatedMessages.slice(i, i + BATCH_SIZE);
    const batchResults = await processBatchWithDelay(batch, language, onProgress);
    
    if (batchResults) {
      // Atualiza o cache com os resultados
      batchResults.forEach(msg => {
        if (msg.translatedText) {
          const cacheKey = `${language}:${msg.message}`;
          translationCache.set(cacheKey, {
            text: msg.translatedText,
            timestamp: Date.now()
          });
        }
      });
      
      results.push(...batchResults);
    }
    
    // Pequena pausa entre lotes para não sobrecarregar
    if (i + BATCH_SIZE < untranslatedMessages.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }
  
  // Combina mensagens traduzidas com as que já estavam prontas
  const translatedMap = new Map(results.map(msg => [msg.id, msg]));
  return uniqueMessages.map(msg => translatedMap.get(msg.id) || msg);
};

// Tipagem para a mensagem recebida pelo worker
interface WorkerMessageEvent<T = any> extends MessageEvent {
  data: {
    type: string;
    payload: T;
  };
}

// Configuração otimizada do worker
const workerContext = self as unknown as WorkerGlobalScope & {
  onmessage: (e: MessageEvent) => void;
  postMessage: (message: any) => void;
};

workerContext.onmessage = async (e: MessageEvent) => {
  // Usa requestIdleCallback para processar mensagens em momentos ociosos
  const idleCallback = (deadline: IdleDeadline) => {
    const messages = e.data.messages || [];
    const language = e.data.language || 'en';
    
    // Processa o lote enquanto houver tempo disponível
    const processNextBatch = async (startIndex: number) => {
      const batch = messages.slice(startIndex, startIndex + BATCH_SIZE);
      if (batch.length === 0) return;
      
      const batchResults = await processBatchWithDelay(
        batch,
        language,
        (results) => {
          // Agrupa mais resultados antes de enviar de volta
          workerContext.postMessage({
            type: 'progress',
            payload: results
          });
        }
      );
      
      // Envia os resultados do lote
      workerContext.postMessage({
        type: 'batchComplete',
        payload: batchResults
      });
      
      // Agenda o próximo lote se ainda houver itens e tempo disponível
      const nextIndex = startIndex + BATCH_SIZE;
      if (nextIndex < messages.length && (deadline.timeRemaining() > 0 || deadline.didTimeout)) {
        setTimeout(() => processNextBatch(nextIndex), 0);
      } else if (nextIndex < messages.length) {
        // Se não houver mais tempo, agenda para continuar depois
        requestIdleCallback(() => processNextBatch(nextIndex));
      }
    };
    
    // Inicia o processamento do primeiro lote
    processNextBatch(0);
  };
  
  // Inicia o processamento usando requestIdleCallback
  if ('requestIdleCallback' in self) {
    (self as any).requestIdleCallback(idleCallback, { timeout: 1000 });
  } else {
    // Fallback para navegadores sem suporte a requestIdleCallback
    setTimeout(() => idleCallback({
      timeRemaining: () => 50, // 50ms para o fallback
      didTimeout: false
    } as IdleDeadline), 0);
  }
  const { type, payload, requestId = Date.now().toString() } = e.data || {};
  
  if (type !== 'TRANSLATE' || !payload) return;
  
  const { messages, language } = payload;
  const startTime = performance.now();
  
  try {
    // Envia um sinal de início com informações de performance
    workerContext.postMessage({
      type: 'TRANSLATION_STARTED',
      requestId,
      total: messages?.length || 0,
      timestamp: startTime
    });
    
    if (!messages?.length) {
      workerContext.postMessage({
        type: 'TRANSLATION_COMPLETE',
        requestId,
        timestamp: performance.now()
      });
      return;
    }
    
    // Processa as mensagens em lotes
    const results = await processTranslationBatch(
      messages,
      language,
      (batchResults) => {
        // Envia atualizações parciais com informações de desempenho
        workerContext.postMessage({
          type: 'PARTIAL_RESULT',
          data: batchResults,
          requestId,
          processed: Math.min(
            messages.length,
            (batchResults?.length || 0) + (results?.length || 0)
          ),
          timestamp: performance.now()
        });
      }
    );
    
    // Envia o sinal de conclusão com métricas de desempenho
    const endTime = performance.now();
    workerContext.postMessage({
      type: 'TRANSLATION_COMPLETE',
      requestId,
      results,
      duration: endTime - startTime,
      timestamp: endTime
    });
    
  } catch (error) {
    console.error('Erro no worker de tradução:', error);
    workerContext.postMessage({
      type: 'TRANSLATION_ERROR',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      requestId,
      timestamp: performance.now()
    });
  }
};

// Adiciona um manipulador de erros global
workerContext.addEventListener('error', (event) => {
  console.error('Erro não tratado no worker de tradução:', event.error || event);
  workerContext.postMessage({
    type: 'WORKER_ERROR',
    error: 'Erro interno no worker de tradução',
    timestamp: performance.now()
  });
});

// Exporta os tipos para uso externo
export type { TranslationResponse };

