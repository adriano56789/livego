import { GiftPayload } from '../components/live/GiftAnimationOverlay';
import { useState, useEffect, useCallback } from 'react';

type GiftType = 'banner' | 'fullscreen';

interface QueuedGift {
  id: number;
  gift: GiftPayload;
  type: GiftType;
  timestamp: number;
}

class GiftQueue {
  private static instance: GiftQueue;
  private bannerQueue: QueuedGift[] = [];
  private fullscreenQueue: QueuedGift[] = [];
  private nextId = 0;
  private isProcessing = false;
  private subscribers: Array<() => void> = [];

  // Padrão Singleton
  public static getInstance(): GiftQueue {
    if (!GiftQueue.instance) {
      GiftQueue.instance = new GiftQueue();
    }
    return GiftQueue.instance;
  }

  // Adiciona um presente à fila apropriada
  public addGift(gift: GiftPayload, type: GiftType = 'banner'): number {
    const id = this.nextId++;
    const queuedGift: QueuedGift = {
      id,
      gift,
      type,
      timestamp: Date.now()
    };

    if (type === 'fullscreen') {
      this.fullscreenQueue.push(queuedGift);
    } else {
      this.bannerQueue.push(queuedGift);
    }

    this.notifySubscribers();
    this.processQueue();
    return id;
  }

  // Processa o próximo presente na fila
  private processQueue() {
    if (this.isProcessing) return;

    // Dá prioridade para presentes em tela cheia
    if (this.fullscreenQueue.length > 0) {
      this.processNextGift('fullscreen');
    } 
    // Depois processa os banners
    else if (this.bannerQueue.length > 0) {
      this.processNextGift('banner');
    } else {
      this.notifySubscribers();
    }
  }

  private processNextGift(type: GiftType) {
    const queue = type === 'fullscreen' ? this.fullscreenQueue : this.bannerQueue;
    if (queue.length === 0) return;

    this.isProcessing = true;
    this.notifySubscribers();

    // Define o tempo de exibição baseado no tipo
    const duration = type === 'fullscreen' ? 4000 : 3000; // 4s para tela cheia, 3s para banner
    
    // Agenda o processamento do próximo presente
    setTimeout(() => {
      this.isProcessing = false;
      this.processQueue();
    }, duration);
  }

  // Retorna o próximo presente a ser exibido
  public getCurrentGift() {
    if (this.fullscreenQueue.length > 0) {
      return { gift: this.fullscreenQueue[0], type: 'fullscreen' as const };
    } else if (this.bannerQueue.length > 0) {
      return { gift: this.bannerQueue[0], type: 'banner' as const };
    }
    return null;
  }

  // Remove o presente atual da fila
  public removeCurrentGift() {
    if (this.fullscreenQueue.length > 0) {
      this.fullscreenQueue.shift();
    } else if (this.bannerQueue.length > 0) {
      this.bannerQueue.shift();
    }
    this.notifySubscribers();
  }

  // Limpa todas as filas
  public clear() {
    this.bannerQueue = [];
    this.fullscreenQueue = [];
    this.notifySubscribers();
  }

  // Inscreve para receber atualizações
  public subscribe(callback: () => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Notifica todos os assinantes
  private notifySubscribers() {
    this.subscribers.forEach(callback => callback());
  }

  // Retorna o estado atual da fila (para debug)
  public getQueueStatus() {
    return {
      bannerQueue: [...this.bannerQueue],
      fullscreenQueue: [...this.fullscreenQueue],
      isProcessing: this.isProcessing
    };
  }
}

export const giftQueue = GiftQueue.getInstance();

// Hook personalizado para usar a fila de presentes
interface GiftQueueState {
  currentGift: { gift: GiftPayload; type: GiftType } | null;
  isProcessing: boolean;
}

export function useGiftQueue(): GiftQueueState {
  const [state, setState] = useState<GiftQueueState>({
    currentGift: giftQueue.getCurrentGift(),
    isProcessing: false
  });

  useEffect(() => {
    const updateState = () => {
      setState({
        currentGift: giftQueue.getCurrentGift(),
        isProcessing: false
      });
    };

    // Inscreve para receber atualizações da fila
    const unsubscribe = giftQueue.subscribe(updateState);
    
    // Atualiza o estado inicial
    updateState();
    
    // Remove a inscrição ao desmontar
    return () => {
      unsubscribe();
    };
  }, []);

  return state;
}
