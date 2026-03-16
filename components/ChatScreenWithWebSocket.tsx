import React, { useState, useEffect } from 'react';
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
  const [messages, setMessages] = useState<any[]>([]);
  
  useEffect(() => {
    // Conectar ao WebSocket quando o chat abrir
    const chatId = `chat_${props.currentUser.id}_${props.user.id}`;
    chatWebSocket.joinChatRoom(chatId);
    
    // Atualizar status online
    chatWebSocket.updateStatus(props.currentUser.id, true);
    
    // Listener para novas mensagens
    const handleNewMessage = (event: CustomEvent) => {
      // Adicionar mensagem ao estado em vez de recarregar a página
      setMessages(prev => [...prev, event.detail]);
    };
    
    // Listener para status de usuários
    const handleStatusChanged = (event: CustomEvent) => {
      // Aqui você pode atualizar o status online/offline
    };
    
    window.addEventListener('newChatMessage', handleNewMessage as EventListener);
    window.addEventListener('userStatusChanged', handleStatusChanged as EventListener);
    
    return () => {
      chatWebSocket.leaveChatRoom(chatId);
      window.removeEventListener('newChatMessage', handleNewMessage as EventListener);
      window.removeEventListener('userStatusChanged', handleStatusChanged as EventListener);
    };
  }, [props.currentUser?.id, props.user?.id]);

  if (!props.currentUser || !props.user) {
      return <div className="h-full flex items-center justify-center bg-black text-white">Carregando...</div>;
  }

  return <ChatScreen {...props} messages={messages} />;
};

export default ChatScreenWithWebSocket;
