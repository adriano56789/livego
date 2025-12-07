import { useState, useCallback, useRef, useEffect } from 'react';
import type { TranslationMessage } from '../workers/translation.worker';

type Message = {
  id: string | number;
  user: string;
  message: string;
  translatedText?: string;
  type: string;
  avatar?: string;
};

type WorkerMessage = 
  | { type: 'PARTIAL_RESULT'; data: TranslationMessage[] }
  | { type: 'TRANSLATION_COMPLETE'; data: TranslationMessage[] }
  | { type: 'TRANSLATION_ERROR'; error: string };

export const useChatMessages = (initialMessages: Message[] = []) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const messageQueue = useRef<Message[]>([]);
  const isProcessing = useRef(false);
  const workerRef = useRef<Worker | null>(null);
  const [isWorkerReady, setIsWorkerReady] = useState(false);

  // Inicializa o worker
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const worker = new Worker(new URL('../workers/translation.worker.ts', import.meta.url), { type: 'module' });
    
    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const { type, data, error } = e.data as any;
      
      switch (type) {
        case 'PARTIAL_RESULT':
          // Atualiza mensagens com traduções parciais
          setMessages(prev => {
            const updated = [...prev];
            data.forEach((translatedMsg: TranslationMessage) => {
              const index = updated.findIndex(m => m.id === translatedMsg.id);
              if (index !== -1) {
                updated[index] = { ...updated[index], ...translatedMsg };
              }
            });
            return updated;
          });
          break;
          
        case 'TRANSLATION_COMPLETE':
          // Processamento em lote concluído
          setMessages(prev => {
            const updated = [...prev];
            data.forEach((translatedMsg: TranslationMessage) => {
              const index = updated.findIndex(m => m.id === translatedMsg.id);
              if (index !== -1) {
                updated[index] = { ...updated[index], ...translatedMsg };
              }
            });
            return updated;
          });
          isProcessing.current = false;
          processQueue(); // Processa o próximo lote
          break;
          
        case 'TRANSLATION_ERROR':
          console.error('Erro na tradução:', error);
          isProcessing.current = false;
          processQueue(); // Tenta continuar com o próximo lote mesmo em caso de erro
          break;
      }
    };
    
    workerRef.current = worker;
    setIsWorkerReady(true);
    return () => {
      worker.terminate();
    };
  }, []);

  // Processa a fila de mensagens
  const processQueue = useCallback(() => {
    if (messageQueue.current.length === 0 || !workerRef.current || isProcessing.current || !isWorkerReady) {
      return;
    }

    isProcessing.current = true;
    const batch = messageQueue.current.splice(0, 10); // Processa em lotes menores
    
    workerRef.current.postMessage({ type: 'TRANSLATE', payload: { messages: batch, language: 'pt' } });
    
    // Processa o próximo lote após um pequeno delay
    if (messageQueue.current.length > 0) {
      setTimeout(processQueue, 100);
    }
  }, [isWorkerReady]);

  // Adiciona mensagem à fila
  const addMessage = useCallback((message: Message) => {
    // Adiciona a mensagem imediatamente para feedback visual
    setMessages(prev => [...prev, message]);
    
    // Adiciona à fila para processamento em segundo plano
    messageQueue.current.push(message);
    
    // Inicia o processamento se não estiver em andamento
    if (!isProcessing.current) {
      processQueue();
    }
  }, [processQueue]);

  // Limpa todas as mensagens
  const clearMessages = useCallback(() => {
    setMessages([]);
    messageQueue.current = [];
  }, []);

  return {
    messages,
    addMessage,
    clearMessages,
  };
};

export default useChatMessages;
