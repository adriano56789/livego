
import React, { useState, useEffect, useRef } from 'react';
import type { Conversation, ConversationMessage, PublicProfile, Stream, PkBattle, User } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import EllipsisIcon from './icons/EllipsisIcon';
import ActionsModal from './ActionsModal';
import UserProfileModal from './UserProfileModal';
import BlockScreen from './BlockScreen';
import ChatInput from './ChatInput';
import DoubleCheckIcon from './icons/DoubleCheckIcon';
import CheckIcon from './icons/CheckIcon';

interface ChatScreenProps {
  conversationId: string;
  currentUserId: number;
  user: User;
  onUpdateUser: (user: User) => void;
  onExit: () => void;
  onViewProtectors: (userId: number) => void;
  onViewStream: (stream: Stream | PkBattle) => void;
}

const ChatBubble: React.FC<{ message: ConversationMessage; isSender: boolean }> = ({ message, isSender }) => {
  if (message.type === 'system') {
    return (
      <div className="self-center text-center text-xs text-gray-400 bg-gray-800/50 rounded-full py-1 px-3 my-2">
        {message.text}
      </div>
    );
  }

  const bubbleClass = isSender
    ? 'bg-green-600 self-end rounded-br-none'
    : 'bg-[#373738] self-start rounded-bl-none';

  const formatTimestamp = (ts: string) => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex flex-col max-w-xs md:max-w-md ${isSender ? 'self-end' : 'self-start'}`}>
        <div className={`px-3 py-2 rounded-2xl ${bubbleClass}`}>
            {message.type === 'image' && message.imageUrl ? (
                <a href={message.imageUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <img src={message.imageUrl} alt="Imagem enviada" className="rounded-lg max-w-full h-auto" style={{ maxHeight: '200px', minWidth: '150px' }} />
                </a>
            ) : (
                <p className="text-white text-base break-words">{message.text}</p>
            )}
            <div className="flex items-center justify-end gap-1.5 mt-1 pt-1">
                <span className="text-xs text-gray-200/80">{formatTimestamp(message.timestamp)}</span>
                {isSender && message.status === 'sent' && (
                    <CheckIcon className="w-4 h-4 text-gray-200/80" />
                )}
                {isSender && message.status === 'seen' && (
                    <DoubleCheckIcon className="w-4 h-4 text-green-300" />
                )}
            </div>
        </div>
    </div>
  );
};


const ChatScreen: React.FC<ChatScreenProps> = ({ conversationId, currentUserId, user, onUpdateUser, onExit, onViewProtectors, onViewStream }) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAndMarkRead = async () => {
      setIsLoading(true);
      try {
        await liveStreamService.markMessagesAsSeen(conversationId, currentUserId);
        const convo = await liveStreamService.getConversationById(conversationId, currentUserId);
        setConversation(convo);
      } catch (error) {
        console.error("Failed to load conversation:", error);
        onExit(); // Exit if conversation not found
      } finally {
        setIsLoading(false);
      }
    };
    fetchAndMarkRead();
  }, [conversationId, onExit, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages.length]);

  const handleSendMessage = async (message: string) => {
    if (!conversation) return;
    try {
        const updatedConversation = await liveStreamService.sendMessageToConversation(
            conversation.id,
            currentUserId,
            { text: message }
        );
        setConversation(updatedConversation);
    } catch(error) {
        console.error("Failed to send message", error);
        alert("Erro ao enviar mensagem.");
    }
  };

  const handleImageSelected = async (file: File) => {
    if (!conversation) return;
    setIsUploading(true);
    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async (event) => {
            try {
                const imageDataUrl = event.target?.result as string;
                if (!imageDataUrl) {
                    throw new Error("Não foi possível ler o arquivo de imagem.");
                }
                const { url } = await liveStreamService.uploadChatImage(imageDataUrl);
                const updatedConversation = await liveStreamService.sendMessageToConversation(
                    conversation.id,
                    currentUserId,
                    { imageUrl: url }
                );
                setConversation(updatedConversation);
            } catch (err) {
                 console.error("Failed to send image", err);
                 alert(err instanceof Error ? err.message : "Erro ao enviar imagem.");
            } finally {
                setIsUploading(false);
            }
        };
        reader.onerror = (error) => {
            console.error("Erro ao ler o arquivo:", error);
            alert("Erro ao processar a imagem.");
            setIsUploading(false);
        };
    } catch (error) {
        console.error("Failed to prepare image", error);
        alert("Erro ao preparar a imagem.");
        setIsUploading(false);
    }
  };

  const handleBlock = () => {
    if (!conversation) return;
    liveStreamService.blockUser(currentUserId, conversation.otherUserId);
    setIsActionsModalOpen(false);
    setIsBlocked(true);
  };
    
  const handleReport = () => {
    if (!conversation) return;
    liveStreamService.reportUser(currentUserId, conversation.otherUserId);
    alert(`Denúncia sobre ${conversation.otherUserName} enviada.`);
    setIsActionsModalOpen(false);
  };

  const handleUnblock = async () => {
    if (!conversation) return;
    try {
        await liveStreamService.unblockUser(currentUserId, conversation.otherUserId);
        setIsBlocked(false); // Go back to chat
    } catch(err) {
        console.error("Failed to unblock user:", err);
        alert("Não foi possível desbloquear o usuário. Tente novamente.");
    }
  };

  const handleViewProfile = () => {
    setIsActionsModalOpen(false);
    setIsProfileModalOpen(true);
  };
    
  const otherUserProfileForModal: PublicProfile | null = conversation ? {
      id: conversation.otherUserId,
      name: conversation.otherUserName,
      nickname: conversation.otherUserName,
      avatarUrl: conversation.otherUserAvatarUrl,
      age: null,
      gender: null,
      birthday: null,
      isLive: false,
      isFollowing: false,
      isFriend: !!conversation.isFriend,
      followers: 0,
      followingCount: 0,
      // FIX: Add missing 'recebidos' and 'enviados' properties to PublicProfile object.
      recebidos: 0,
      enviados: 0,
      coverPhotoUrl: '',
      stats: { value: 0, icon: 'moon' },
      badges: [],
      protectors: [],
      achievements: [],
      personalityTags: [],
      personalSignature: '',
  } : null;
  
  if (isLoading || !conversation) {
    return (
      <div className="h-screen w-full bg-[#121212] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isBlocked) {
    return (
        <BlockScreen
            userName={conversation.otherUserName}
            onUnblock={handleUnblock}
            onExit={() => setIsBlocked(false)}
            bgColor="bg-[#121212]"
        />
    );
  }

  return (
    <div className="h-screen w-full bg-[#121212] flex flex-col text-white font-sans">
      <header className="p-4 flex items-center justify-between bg-[#1c1c1c] border-b border-gray-800 shrink-0">
        <button onClick={onExit}><ArrowLeftIcon className="w-6 h-6" /></button>
        <button onClick={() => setIsProfileModalOpen(true)} className="flex flex-col items-center rounded-lg p-2 -m-2 transition-colors hover:bg-gray-700/50">
            <h1 className="font-semibold">{conversation.otherUserName}</h1>
            <span className="text-xs text-gray-400">Online</span>
        </button>
        <button onClick={() => setIsActionsModalOpen(true)}><EllipsisIcon className="w-6 h-6" /></button>
      </header>

      <main className="flex-grow p-4 overflow-y-auto flex flex-col gap-3 scrollbar-hide">
        {conversation.messages.map(msg => (
          <ChatBubble key={msg.id} message={msg} isSender={msg.senderId === currentUserId} />
        ))}
         <div ref={messagesEndRef} />
      </main>

      <footer className="p-2 bg-[#1c1c1c] shrink-0">
        <ChatInput onSendMessage={handleSendMessage} onImageSelected={handleImageSelected} isUploading={isUploading} />
      </footer>

      {otherUserProfileForModal && (
          <ActionsModal 
              isOpen={isActionsModalOpen}
              onClose={() => setIsActionsModalOpen(false)}
              user={otherUserProfileForModal}
              onBlock={handleBlock}
              onReport={handleReport}
              onViewProfile={handleViewProfile}
          />
      )}
      {isProfileModalOpen && conversation && (
        <UserProfileModal
            userId={conversation.otherUserId}
            currentUser={user}
            onUpdateUser={onUpdateUser}
            onClose={() => setIsProfileModalOpen(false)}
            onNavigateToChat={(userId) => {
                // If trying to chat with the same user, just close the modal.
                // Otherwise, could navigate to a new chat, but for now we just close.
                setIsProfileModalOpen(false);
            }}
            onViewProtectors={onViewProtectors}
            onViewStream={onViewStream}
        />
      )}
    </div>
  );
};

export default ChatScreen;
