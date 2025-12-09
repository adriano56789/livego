import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { TranslationMessage } from '../workers/translation.worker';

type Message = {
  id: string | number;
  user: string;
  message: string;
  translatedText?: string;
  type: string;
  avatar?: string;
  isTranslating?: boolean;
};

type WorkerMessage = 
  | { type: 'PARTIAL_RESULT'; data: TranslationMessage[]; requestId: string }
  | { type: 'TRANSLATION_COMPLETE'; requestId: string; total?: number }
  | { type: 'TRANSLATION_ERROR'; error: string; requestId: string }
  | { type: 'TRANSLATION_STARTED'; requestId: string; total: number };

// Tamanho máximo da fila para evitar consumo excessivo de memória
const MAX_QUEUE_SIZE = 50;
// Tempo mínimo entre processamentos em ms
const PROCESSING_THROTTLE_MS = 100;

export const useChatMessages = (initialMessages: Message[] = []) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const messageQueue = useRef<Message[]>([]);
  const isProcessing = useRef(false);
  const workerRef = useRef<Worker | null>(null);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const lastProcessTime = useRef(0);
  const activeRequestId = useRef<string | null>(null);
  const pendingUpdates = useRef<Map<string | number, Message>>(new Map());
  const updateTimeout = useRef<NodeJS.Timeout | null>(null);

  // Função para aplicar atualizações em lote
  const applyPendingUpdates = useCallback(() => {
    if (pendingUpdates.current.size === 0) return;

    setMessages(prev => {
      const updated = [...prev];
      let hasChanges = false;

      pendingUpdates.current.forEach((updatedMsg, id) => {
        const index = updated.findIndex(m => m.id === id);
        if (index !== -1) {
          updated[index] = { ...updated[index], ...updatedMsg, isTranslating: false };
          hasChanges = true;
        }
      });

      return hasChanges ? updated : prev;
    });

    pendingUpdates.current.clear();
  }, []);

  // Efeito para inicializar o worker
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const worker = new Worker(new URL('../workers/translation.worker.ts', import.meta.url), { 
      type: 'module' 
    });
    
    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const { type, requestId } = e.data;
      
      // Ignora mensagens de requisições antigas
      if (activeRequestId.current !== requestId) return;
      
      switch (type) {
        case 'TRANSLATION_STARTED':
          // Marca as mensagens como em tradução
          setMessages(prev => 
            prev.map(msg => ({
              ...msg,
              isTranslating: true
            }))
          );
          break;
          
        case 'PARTIAL_RESULT':
          // Acumula atualizações para aplicar em lote
          (e.data as any).data.forEach((msg: TranslationMessage) => {
            pendingUpdates.current.set(msg.id, {
              ...msg,
              isTranslating: false
            });
          });
          
          // Agenda a aplicação das atualizações
          if (updateTimeout.current) {
            clearTimeout(updateTimeout.current);
          }
          updateTimeout.current = setTimeout(applyPendingUpdates, 50);
          break;
          
        case 'TRANSLATION_COMPLETE':
          isProcessing.current = false;
          lastProcessTime.current = Date.now();
          processQueue(); // Processa o próximo lote
          break;
          
        case 'TRANSLATION_ERROR':
          console.error('Erro na tradução:', e.data.error);
          isProcessing.current = false;
          lastProcessTime.current = Date.now();
          // Remove o estado de tradução das mensagens
          setMessages(prev => 
            prev.map(msg => ({
              ...msg,
              isTranslating: false
            }))
          );
          processQueue(); // Tenta continuar com o próximo lote
          break;
      }
    };
    
    workerRef.current = worker;
    setIsWorkerReady(true);
    
    return () => {
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }
      worker.terminate();
    };
  }, [applyPendingUpdates]);

  // Processa a fila de mensagens
  const processQueue = useCallback(() => {
    const now = Date.now();
    const timeSinceLastProcess = now - lastProcessTime.current;
    const shouldProcess = 
      messageQueue.current.length > 0 && 
      !isProcessing.current && 
      isWorkerReady && 
      timeSinceLastProcess >= PROCESSING_THROTTLE_MS;

    if (!shouldProcess) return;

    // Limita o tamanho da fila para evitar consumo excessivo de memória
    if (messageQueue.current.length > MAX_QUEUE_SIZE) {
      console.warn('Fila de tradução muito grande, descartando mensagens antigas');
      messageQueue.current = messageQueue.current.slice(-MAX_QUEUE_SIZE);
    }

    isProcessing.current = true;
    const batch = messageQueue.current.splice(0, 5); // Lotes menores para melhor desempenho
    
    // Gera um ID único para a requisição
    activeRequestId.current = Date.now().toString();
    
    workerRef.current?.postMessage({ 
      type: 'TRANSLATE', 
      payload: { 
        messages: batch, 
        language: 'pt',
        requestId: activeRequestId.current
      } 
    });
  }, [isWorkerReady]);

  // Adiciona mensagem à fila
  const addMessage = useCallback((message: Message) => {
    // Adiciona a mensagem imediatamente para feedback visual
    setMessages(prev => [...prev, { ...message, isTranslating: true }]);
    
    // Adiciona à fila de tradução se necessário
    if (message.message.trim() !== '') {
      messageQueue.current.push(message);
      
      // Usa requestAnimationFrame para processar na próxima renderização
      requestAnimationFrame(() => {
        processQueue();
      });
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
