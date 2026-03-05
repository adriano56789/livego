import React, { useEffect } from 'react';
import ChatScreen from './ChatScreen';
import { chatWebSocket } from '../services/chatWebSocket';

interface ChatScreenWithWebSocketProps {
  user: any;
  onBack: () => void;
  isModal: boolean;
  currentUser: any;
  onNavigateToFriends: () => void;
  onFollowUser: (user: any) => void;
  onBlockUser: (user: any) => void;
  onReportUser: (user: any) => void;
  onOpenPhotoViewer: (photos: any[], index: number) => void;
}

const ChatScreenWithWebSocket: React.FC<ChatScreenWithWebSocketProps> = (props) => {
  useEffect(() => {
    // Conectar ao WebSocket quando o chat abrir
    const chatId = `chat_${props.currentUser.id}_${props.user.id}`;
    chatWebSocket.joinChatRoom(chatId);
    
    // Atualizar status online
    chatWebSocket.updateStatus(props.currentUser.id, true);
    
    // Listener para novas mensagens
    const handleNewMessage = (event: CustomEvent) => {
      console.log('💬 Nova mensagem via WebSocket:', event.detail);
      // Aqui você pode atualizar o estado das mensagens
      // Por enquanto, vamos apenas recarregar as mensagens
      window.location.reload();
    };
    
    // Listener para status de usuários
    const handleStatusChanged = (event: CustomEvent) => {
      console.log('🔔 Status mudou via WebSocket:', event.detail);
      // Aqui você pode atualizar o status online/offline
    };
    
    window.addEventListener('newChatMessage', handleNewMessage as EventListener);
    window.addEventListener('userStatusChanged', handleStatusChanged as EventListener);
    
    return () => {
      chatWebSocket.leaveChatRoom(chatId);
      window.removeEventListener('newChatMessage', handleNewMessage as EventListener);
      window.removeEventListener('userStatusChanged', handleStatusChanged as EventListener);
    };
  }, [props.currentUser.id, props.user.id]);

  return <ChatScreen {...props} />;
};

export default ChatScreenWithWebSocket;
