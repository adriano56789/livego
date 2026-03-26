import { io, Socket } from 'socket.io-client';

const getWebSocketUrl = () => {
    // Em desenvolvimento, detectar automaticamente o IP do backend
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'ws://192.168.3.12:3000'; // IP fixo do backend
    }
    
    // Em produção, usar o mesmo domínio com protocolo correto
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.hostname}`;
};

const WS_URL = getWebSocketUrl();

class SocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Function[]> = new Map();
    private heartbeatInterval: NodeJS.Timeout | null = null;

    connect() {
        if (this.socket?.connected) return;


        this.socket = io(WS_URL, {
            transports: ['websocket', 'polling'], // Fallback to polling if necessary
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            autoConnect: true
        });

        this.socket.on('connect', () => {
            
            // Iniciar heartbeat
            this.startHeartbeat();
        });

        this.socket.on('connect_error', (err) => {
        });

        this.socket.on('disconnect', (reason) => {
            this.stopHeartbeat();
        });

        // Re-attach general dynamic listeners
        this.listeners.forEach((callbacks, event) => {
            callbacks.forEach(cb => {
                this.socket?.on(event, cb as any);
            });
        });
    }

    private startHeartbeat() {
        this.stopHeartbeat(); // Limpar heartbeat anterior
        
        this.heartbeatInterval = setInterval(() => {
            if (this.socket?.connected) {
                this.socket?.emit('heartbeat');
            }
        }, 30000); // Heartbeat a cada 30 segundos
    }

    private stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    disconnect() {
        this.stopHeartbeat(); // Parar heartbeat
        
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    joinRoom(roomId: string) {
        if (!this.socket?.connected) this.connect();
        this.socket?.emit('join_room', roomId);
    }

    leaveRoom(roomId: string) {
        this.socket?.emit('leave_room', roomId);
    }

    // --- Chat & Message Methods ---
    sendChatMessage(from: string, to: string, text?: string, imageUrl?: string) {
        this.getSocket()?.emit('send_chat_message', { from, to, text, imageUrl });
    }

    updateUserStatus(userId: string, isOnline: boolean) {
        this.getSocket()?.emit('user_status_update', { userId, isOnline });
    }

    // --- Eventos para mensagens de chat
    onNewChatMessage(callback: (message: any) => void) {
        this.on('new_chat_message', callback);
    }

    onUserStatusChanged(callback: (data: any) => void) {
        this.on('user_status_changed', callback);
    }

    // --- Métodos existentes (mantidos para compatibilidade) ---
    sendMessage(roomId: string, message: any) {
        this.socket?.emit('send_message', { roomId, message });
    }

    sendGift(roomId: string, gift: any) {
        this.socket?.emit('send_gift', { roomId, gift });
    }

    // Eventos de presença online
    onUserJoined(callback: (data: { userId: string; userName: string; userAvatar: string; userLevel: number; streamId: string; timestamp: string }) => void) {
        this.on('user_joined_stream', callback);
    }

    onUserLeft(callback: (data: { userId: string; userName: string; streamId: string; timestamp: string }) => void) {
        this.on('user_left_stream', callback);
    }

    // Eventos para status online/offline
    onUserOnline(callback: (data: { userId: string; isOnline: boolean; timestamp: string }) => void) {
        this.on('user_online', callback);
    }

    onUserOffline(callback: (data: { userId: string; isOnline: false; lastSeen: string; timestamp: string }) => void) {
        this.on('user_offline', callback);
    }

    // Evento para quando um presente é enviado para a stream
    onGiftSentToStream(callback: (data: { streamId: string; gift: { fromUserId: string; fromUserName: string; fromUserAvatar: string; giftName: string; giftIcon: string; giftPrice: number; quantity: number; totalValue: number }; timestamp: string }) => void) {
        this.on('gift_sent_to_stream', callback);
    }

    // Evento para quando um presente é recebido
    onGiftReceived(callback: (data: { from: { id: string; name: string; avatarUrl: string }; gift: { id: string; name: string; icon: string; price: number }; quantity: number; totalValue: number; streamId: string; timestamp: string }) => void) {
        this.on('gift_received', callback);
    }

    // Evento para quando os contadores de moedas da live são atualizados
    onLiveCoinsUpdated(callback: (data: { streamId: string; coins: number; totalCoins: number }) => void) {
        this.on('live_coins_updated', callback);
    }

    // Eventos para mensagens de chat
    onNewMessage(callback: (message: any) => void) {
        this.on('new_message', callback);
    }

    onViewersCountUpdated(callback: (data: { count: number; streamId: string }) => void) {
        this.on('viewers_count_updated', callback);
    }

    // Evento para quando uma live é encerrada
    onStreamEnded(callback: (data: { streamId: string; hostId: string; timestamp: string }) => void) {
        this.on('stream_ended', callback);
    }

    // Evento para quando o usuário atual precisa sair de uma live encerrada
    onLiveStreamEnded(callback: (data: { streamId: string; message: string; timestamp: string }) => void) {
        this.on('live_stream_ended', callback);
    }

    // Evento para quando um card é removido
    onCardRemoved(callback: (data: { streamId: string; hostId: string; timestamp: string }) => void) {
        this.on('card_removed', callback);
    }

    // Evento para quando o servidor SRS reinicia
    onSrsServerRestarted(callback: (data: { serverId: string; message: string; timestamp: string }) => void) {
        this.on('srs_server_restarted', callback);
    }

    on(event: string, callback: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(callback);

        if (this.socket) {
            this.socket.on(event, callback as any);
        }
    }

    off(event: string, callback?: Function) {
        if (callback) {
            const callbacks = this.listeners.get(event) || [];
            this.listeners.set(event, callbacks.filter(cb => cb !== callback));
            if (this.socket) {
                this.socket.off(event, callback as any);
            }
        } else {
            this.listeners.delete(event);
            if (this.socket) {
                this.socket.off(event);
            }
        }
    }

    getSocket() {
        return this.socket;
    }
}

export const socketService = new SocketService();
