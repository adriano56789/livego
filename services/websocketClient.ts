import { io, Socket } from 'socket.io-client';

// Configuração da URL do WebSocket
const WEBSOCKET_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000'
  : 'https://3000-iutlks2qb2rjvz6y0nuke-501e7ed6.manusvm.computer';

class WebSocketClient {
  private socket: Socket | null = null;
  private currentStreamId: string | null = null;

  connect() {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(WEBSOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('WebSocket conectado:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket desconectado');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erro de conexão WebSocket:', error);
    });

    // Listeners para eventos do backend
    this.socket.on('new-stream', (streamData) => {
      console.log('Nova stream:', streamData);
      // Disparar evento para atualizar a lista de streams
      window.dispatchEvent(new CustomEvent('stream-updated', { detail: streamData }));
    });

    this.socket.on('viewer-joined', (data) => {
      console.log('Viewer entrou:', data);
      window.dispatchEvent(new CustomEvent('viewer-joined', { detail: data }));
    });

    this.socket.on('viewer-left', (data) => {
      console.log('Viewer saiu:', data);
      window.dispatchEvent(new CustomEvent('viewer-left', { detail: data }));
    });

    this.socket.on('new-chat-message', (message) => {
      console.log('Nova mensagem:', message);
      window.dispatchEvent(new CustomEvent('new-chat-message', { detail: message }));
    });

    this.socket.on('gift-sent', (giftData) => {
      console.log('Presente enviado:', giftData);
      window.dispatchEvent(new CustomEvent('gift-sent', { detail: giftData }));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentStreamId = null;
    }
  }

  joinStream(streamId: string) {
    if (this.socket && streamId !== this.currentStreamId) {
      if (this.currentStreamId) {
        this.socket.emit('leave-stream', this.currentStreamId);
      }
      this.socket.emit('join-stream', streamId);
      this.currentStreamId = streamId;
      console.log(`Entrou na stream: ${streamId}`);
    }
  }

  leaveStream() {
    if (this.socket && this.currentStreamId) {
      this.socket.emit('leave-stream', this.currentStreamId);
      this.currentStreamId = null;
      console.log('Saiu da stream');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Instância singleton do cliente WebSocket
export const websocketClient = new WebSocketClient();

// Auto-conectar quando o módulo for carregado
websocketClient.connect();

