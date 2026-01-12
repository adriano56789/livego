import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { API_CONFIG } from './config';

const SOCKET_URL = API_CONFIG.WS_URL;

export class WebSocketManager {
    private socket: Socket | null = null;
    private callbacks: Map<string, ((data: any) => void)[]> = new Map();

    connect(userId: string) {
        if (this.socket) return;
        this.socket = io(SOCKET_URL, {
            query: { userId },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5
        });

        this.socket.on('connect', () => console.log(`[WS] Conectado ao Servidor em: ${SOCKET_URL}`));
        this.socket.onAny((event: string, data: any) => {
            this.triggerHandlers(event, data);
        });
    }

    // Helper para o modo Mock disparar eventos como se viessem do socket real
    emitSimulatedEvent(event: string, data: any) {
        this.triggerHandlers(event, data);
    }

    private triggerHandlers(event: string, data: any) {
        const handlers = this.callbacks.get(event);
        if (handlers) {
            handlers.forEach(handler => handler(data));
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emit(event: string, data: any) {
        if (this.socket && this.socket.connected) {
            this.socket.emit(event, data);
        }
    }

    on(event: string, callback: (data: any) => void) {
        if (!this.callbacks.has(event)) this.callbacks.set(event, []);
        this.callbacks.get(event)!.push(callback);
    }

    off(event: string, callback: (data: any) => void) {
        const handlers = this.callbacks.get(event);
        if (handlers) this.callbacks.set(event, handlers.filter(h => h !== callback));
    }
}

export const webSocketManager = new WebSocketManager();