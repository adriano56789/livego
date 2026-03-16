import { socketService } from './socket';

class ChatWebSocket {
  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Status online/offline
    socketService.on('user_status_changed', (data: any) => {
      // Disparar evento customizado para componentes ouvirem
      window.dispatchEvent(new CustomEvent('userStatusChanged', { detail: data }));
    });

    // Novas mensagens de chat
    socketService.on('new_chat_message', (message: any) => {
      // Disparar evento customizado para componentes ouvirem
      window.dispatchEvent(new CustomEvent('newChatMessage', { detail: message }));
    });
  }

  // Enviar mensagem via WebSocket
  sendMessage(from: string, to: string, text: string, imageUrl?: string) {
    socketService.getSocket()?.emit('send_chat_message', { from, to, text, imageUrl });
  }

  // Atualizar status online/offline
  updateStatus(userId: string, isOnline: boolean) {
    socketService.getSocket()?.emit('user_status_update', { userId, isOnline });
  }

  // Entrar em sala de chat
  joinChatRoom(chatId: string) {
    socketService.joinRoom(chatId);
  }

  // Sair de sala de chat
  leaveChatRoom(chatId: string) {
    socketService.leaveRoom(chatId);
  }
}

export const chatWebSocket = new ChatWebSocket();
