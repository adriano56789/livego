import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { API_CONFIG } from './config';

const SOCKET_URL = API_CONFIG.WS_URL;

export class WebSocketManager {
    private socket: Socket | null = null;
    private callbacks: Map<string, ((data: any) => void)[]> = new Map();

    connect(userId: string) {
        if (this.socket?.connected) return;

        this.socket = io(SOCKET_URL, {
            query: { userId },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
            console.log(`[WS] Connected to server: ${SOCKET_URL}`);
        });

        this.socket.on('disconnect', (reason) => {
            console.log(`[WS] Disconnected: ${reason}`);
        });

        this.socket.on('connect_error', (error) => {
            console.error('[WS] Connection error:', error);
        });

        this.socket.onAny((event: string, data: any) => {
            this.triggerHandlers(event, data);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emit(event: string, data: any) {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        } else {
            console.warn('[WS] Cannot emit - not connected');
        }
    }

    on(event: string, callback: (data: any) => void) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event)!.push(callback);
    }

    off(event: string, callback: (data: any) => void) {
        const handlers = this.callbacks.get(event);
        if (handlers) {
            this.callbacks.set(event, handlers.filter(h => h !== callback));
        }
    }

    private triggerHandlers(event: string, data: any) {
        const handlers = this.callbacks.get(event);
        if (handlers) {
            handlers.forEach(handler => handler(data));
        }
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

export const webSocketManager = new WebSocketManager();