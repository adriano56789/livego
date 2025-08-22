

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User, Conversation, ConversationMessage, PublicProfile } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import * as authService from '../services/authService';
import CrossIcon from './icons/CrossIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ConversationListItem from './ConversationListItem';
import ChatInput from './ChatInput';
import CheckIcon from './icons/CheckIcon';
import DoubleCheckIcon from './icons/DoubleCheckIcon';
import EllipsisIcon from './icons/EllipsisIcon';
import ActionsModal from './ActionsModal';


interface PrivateChatModalProps {
    user: User;
    onClose: () => void;
}

const ChatBubble: React.FC<{ message: ConversationMessage; isSender: boolean }> = ({ message, isSender }) => {
  const bubbleClass = isSender ? 'bg-green-600 self-end rounded-br-none' : 'bg-[#373738] self-start rounded-bl-none';
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
          {isSender && message.status === 'sent' && <CheckIcon className="w-4 h-4 text-gray-200/80" />}
          {isSender && message.status === 'seen' && <DoubleCheckIcon className="w-4 h-4 text-green-300" />}
        </div>
      </div>
    </div>
  );
};

const PrivateChatModal: React.FC<PrivateChatModalProps> = ({ user, onClose }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
    
    const fetchConversations = useCallback(async () => {
        setIsLoading(true);
        try {
          const convos = await authService.getConversations(user.id);
          setConversations(convos);
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
    }, [user.id]);
    
    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeConversation?.messages.length]);
    
    const handleSelectConversation = async (conversationId: string) => {
        const convoToLoad = conversations.find(c => c.id === conversationId);
        if (convoToLoad) {
            setIsLoading(true);
            try {
                const fullConvo = await liveStreamService.getConversationById(conversationId, user.id);
                setActiveConversation(fullConvo);
                setConversations(convos => convos.map(c => c.id === conversationId ? {...c, unreadCount: 0} : c));
            } catch (error) {
                console.error("Error loading conversation", error);
            } finally {
                setIsLoading(false);
            }
        }
    };
    
    const handleSendMessage = async (message: string) => {
        if (!activeConversation) return;
        try {
            const updatedConversation = await liveStreamService.sendMessageToConversation(
                activeConversation.id,
                user.id,
                { text: message }
            );
            setActiveConversation(updatedConversation);
            // also update in the main list
             setConversations(convos => convos.map(c => 
                c.id === updatedConversation.id 
                ? { ...c, messages: updatedConversation.messages, unreadCount: 0 } 
                : c
            ).sort((a, b) => {
                const messagesA = a.messages || [];
                const messagesB = b.messages || [];
                if ((messagesA).length === 0) return 1;
                if ((messagesB).length === 0) return -1;
                const lastMsgA = messagesA[messagesA.length - 1];
                const lastMsgB = messagesB[messagesB.length - 1];
                return new Date(lastMsgB.timestamp).getTime() - new Date(lastMsgA.timestamp).getTime();
            }));

        } catch(error) {
            console.error("Failed to send message", error);
        }
    };

    const handleImageSelected = async (file: File) => {
        if (!activeConversation) return;
        setIsUploading(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async (event) => {
                const imageDataUrl = event.target?.result as string;
                const { url } = await liveStreamService.uploadChatImage(imageDataUrl);
                const updatedConversation = await liveStreamService.sendMessageToConversation(
                    activeConversation.id,
                    user.id,
                    { imageUrl: url }
                );
                setActiveConversation(updatedConversation);
                 setConversations(convos => convos.map(c => c.id === updatedConversation.id ? { ...c, messages: updatedConversation.messages } : c));
            };
        } catch (error) {
            console.error("Failed to send image", error);
            alert("Erro ao enviar imagem.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleBlock = () => {
        if (!activeConversation) return;
        liveStreamService.blockUser(user.id, activeConversation.otherUserId);
        setIsActionsModalOpen(false);
        setActiveConversation(null); 
        fetchConversations();
    };
    
    const handleReport = () => {
        if (!activeConversation) return;
        liveStreamService.reportUser(user.id, activeConversation.otherUserId);
        alert(`Denúncia sobre ${activeConversation.otherUserName} enviada.`);
        setIsActionsModalOpen(false);
    };

    const otherUserProfileForModal: PublicProfile | null = activeConversation ? {
        id: activeConversation.otherUserId,
        name: activeConversation.otherUserName,
        nickname: activeConversation.otherUserName,
        avatarUrl: activeConversation.otherUserAvatarUrl,
        age: null, gender: null, birthday: null, isLive: false, isFollowing: false, coverPhotoUrl: '',
        stats: { value: 0, icon: 'coin' }, badges: [], protectors: [], achievements: [],
        personalityTags: [], personalSignature: '',
    } : null;

    const renderConversationList = () => (
        <>
            <header className="p-4 border-b border-white/10 flex items-center justify-center relative shrink-0">
                <h2 className="font-bold text-lg">Bate-papo Privado</h2>
                <button onClick={onClose} className="absolute top-1/2 -translate-y-1/2 right-4">
                    <CrossIcon className="w-6 h-6 text-gray-400" />
                </button>
            </header>
            <main className="p-2 overflow-y-auto flex-grow scrollbar-hide">
                {isLoading && conversations.length === 0 ? (
                    <div className="text-center text-gray-400 pt-10">Carregando...</div>
                ) : conversations.length > 0 ? (
                    <div className="divide-y divide-gray-700/50">
                        {conversations.map(convo => (
                          <ConversationListItem 
                            key={convo.id} 
                            conversation={convo} 
                            onClick={() => handleSelectConversation(convo.id)}
                          />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 pt-20">Nenhuma conversa encontrada.</div>
                )}
            </main>
        </>
    );
    
    const renderChatView = () => (
        <>
            <header className="p-4 flex items-center justify-between bg-[#2c2c2e] shrink-0">
                <button onClick={() => { setActiveConversation(null); fetchConversations(); }}><ArrowLeftIcon className="w-6 h-6" /></button>
                <h2 className="font-semibold">{activeConversation?.otherUserName}</h2>
                <button onClick={() => setIsActionsModalOpen(true)}><EllipsisIcon className="w-6 h-6 text-gray-400" /></button>
            </header>
            <main className="flex-grow p-4 overflow-y-auto flex flex-col gap-3 bg-black/20 scrollbar-hide">
                {isLoading && (!activeConversation || !activeConversation.messages || (activeConversation.messages || []).length === 0) ? (
                    <div className="flex-grow flex items-center justify-center"><div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div></div>
                ) : (
                    (activeConversation?.messages || []).map(msg => (
                      <ChatBubble key={msg.id} message={msg} isSender={msg.senderId === user.id} />
                    ))
                )}
                <div ref={messagesEndRef} />
            </main>
            <footer className="p-2 bg-[#2c2c2e] shrink-0">
                <ChatInput 
                    onSendMessage={handleSendMessage} 
                    onImageSelected={handleImageSelected}
                    isUploading={isUploading}
                />
            </footer>
        </>
    );

    return (
        <>
         <div className="fixed top-0 bottom-0 right-0 w-full max-w-md h-screen z-50 animate-slide-in-right">
            <div className="bg-[#212124] w-full h-full flex flex-col text-white shadow-2xl">
                {activeConversation ? renderChatView() : renderConversationList()}
            </div>
             <style>{`
                @keyframes slide-in-right { 
                    from { transform: translateX(100%); } 
                    to { transform: translateX(0); } 
                }
                .animate-slide-in-right { 
                    animation: slide-in-right 0.3s ease-out forwards; 
                }
            `}</style>
         </div>
         {otherUserProfileForModal && (
            <ActionsModal
                isOpen={isActionsModalOpen}
                onClose={() => setIsActionsModalOpen(false)}
                user={otherUserProfileForModal}
                onBlock={handleBlock}
                onReport={handleReport}
            />
        )}
        </>
    );
};

export default PrivateChatModal;