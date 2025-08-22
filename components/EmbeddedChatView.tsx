

import React, { useState, useEffect, useRef } from 'react';
import type { User, Conversation, ConversationMessage, PublicProfile } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import EllipsisIcon from './icons/EllipsisIcon';
import ActionsModal from './ActionsModal';
import ChatInput from './ChatInput';
import DoubleCheckIcon from './icons/DoubleCheckIcon';
import CheckIcon from './icons/CheckIcon';

interface ChatBubbleProps {
  message: ConversationMessage;
  isSender: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isSender }) => {
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


interface EmbeddedChatViewProps {
  currentUser: User;
  otherUser: PublicProfile;
  onClose: () => void;
}

const EmbeddedChatView: React.FC<EmbeddedChatViewProps> = ({ currentUser, otherUser, onClose }) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getConversation = async () => {
        setIsLoading(true);
        try {
            const convo = await liveStreamService.getOrCreateConversationWithUser(currentUser.id, otherUser.id);
            await liveStreamService.markMessagesAsSeen(convo.id, currentUser.id);
            setConversation(convo);
        } catch (error) {
            console.error("Failed to load conversation:", error);
            onClose();
        } finally {
            setIsLoading(false);
        }
    };
    getConversation();
  }, [currentUser.id, otherUser.id, onClose]);

  useEffect(() => {
    if (!conversation) return;

    const interval = setInterval(async () => {
        try {
            const latestConvo = await liveStreamService.getConversationById(conversation.id, currentUser.id);
            const lastKnownMessageId = (conversation.messages || [])[(conversation.messages || []).length - 1]?.id;
            const lastFetchedMessageId = (latestConvo.messages || [])[(latestConvo.messages || []).length - 1]?.id;

            if (lastFetchedMessageId && lastFetchedMessageId !== lastKnownMessageId) {
                setConversation(latestConvo);
            }
        } catch (error) {
            console.error("Failed to poll for new messages:", error);
        }
    }, 3000);

    return () => clearInterval(interval);
  }, [conversation, currentUser.id]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages.length]);

  const handleSendMessage = async (message: string) => {
    if (!conversation) return;
    try {
        const updatedConversation = await liveStreamService.sendMessageToConversation(
            conversation.id,
            currentUser.id,
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
            const imageDataUrl = event.target?.result as string;
            const { url } = await liveStreamService.uploadChatImage(imageDataUrl);
            const updatedConversation = await liveStreamService.sendMessageToConversation(
                conversation.id,
                currentUser.id,
                { imageUrl: url }
            );
            setConversation(updatedConversation);
        };
    } catch (error) {
        console.error("Failed to send image", error);
        alert("Erro ao enviar imagem.");
    } finally {
        setIsUploading(false);
    }
  };

  const handleBlock = () => {
    liveStreamService.blockUser(currentUser.id, otherUser.id);
    setIsActionsModalOpen(false);
    onClose();
  };
    
  const handleReport = () => {
    liveStreamService.reportUser(currentUser.id, otherUser.id);
    alert(`Denúncia sobre ${otherUser.nickname} enviada.`);
    setIsActionsModalOpen(false);
  };

  return (
    <>
      <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
          onClick={onClose}
      >
        <div 
          className="bg-[#121212] w-full max-w-lg h-[85vh] rounded-t-2xl flex flex-col text-white font-sans animate-slide-up-fast"
          onClick={e => e.stopPropagation()}
        >
          <header className="p-4 flex items-center justify-between bg-[#1c1c1c] border-b border-gray-800 shrink-0 rounded-t-2xl">
            <button onClick={onClose}><ArrowLeftIcon className="w-6 h-6" /></button>
            <h1 className="font-semibold">{otherUser.nickname}</h1>
            <button onClick={() => setIsActionsModalOpen(true)}><EllipsisIcon className="w-6 h-6" /></button>
          </header>

          <main className="flex-grow p-4 overflow-y-auto flex flex-col gap-3 scrollbar-hide">
            {isLoading && (!conversation || (conversation.messages || []).length === 0) ? (
                <div className="flex-grow flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                (conversation?.messages || []).map(msg => (
                    <ChatBubble key={msg.id} message={msg} isSender={msg.senderId === currentUser.id} />
                ))
            )}
            <div ref={messagesEndRef} />
          </main>

          <footer className="p-2 bg-[#1c1c1c] shrink-0">
            <ChatInput 
              onSendMessage={handleSendMessage} 
              onImageSelected={handleImageSelected}
              isUploading={isUploading}
            />
          </footer>
        </div>
      </div>
      <ActionsModal 
          isOpen={isActionsModalOpen}
          onClose={() => setIsActionsModalOpen(false)}
          user={otherUser}
          onBlock={handleBlock}
          onReport={handleReport}
      />
    </>
  );
};

export default EmbeddedChatView;