

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { User, Message, FeedPhoto } from '../types';
import { BackIcon, ThreeDotsIcon, SendIcon, GalleryIcon, CheckIcon, DoubleCheckIcon, UserIcon, CloseIcon, LiveIndicatorIcon, ClockIcon, WarningTriangleIcon, TranslateIcon } from './icons';
import BlockReportModal from './BlockReportModal';
import { useTranslation } from '../i18n';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';
import { webSocketManager } from '../services/websocket';
import { createChatKey, avatarFrames, getRemainingDays, getFrameGlowClass } from '../services/database';

interface ChatScreenProps {
    user: User;
    onBack: () => void;
    isModal: boolean;
    currentUser: User;
    onNavigateToFriends: () => void;
    onFollowUser: (user: User) => void;
    onBlockUser: (user: User) => void;
    onReportUser: (user: User) => void;
    onOpenPhotoViewer: (photos: FeedPhoto[], initialIndex: number) => void;
}

const MessageStatus: React.FC<{ status: Message['status'] }> = ({ status }) => {
    if (status === 'sending') {
        return <ClockIcon className="w-4 h-4 text-gray-400" />;
    }
    if (status === 'failed') {
        return <WarningTriangleIcon className="w-4 h-4 text-red-500" />;
    }
    if (status === 'sent') {
        return <CheckIcon className="w-4 h-4 text-gray-400" />;
    }
    if (status === 'delivered') {
        return <DoubleCheckIcon className="w-4 h-4 text-gray-400" />;
    }
    if (status === 'read') {
        return <DoubleCheckIcon className="w-4 h-4 text-blue-400" />;
    }
    return null;
};

const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const ChatMessageBubble: React.FC<{ message: Message; isMe: boolean; user: User; onImageClick: (url: string) => void; }> = ({ message, isMe, user, onImageClick }) => {
    const isObservable = !isMe && message.status !== 'read';
    const [isTranslated, setIsTranslated] = useState(false);

    const activeOwnedFrame = user.ownedFrames.find(f => f.frameId === user.activeFrameId);
    const remainingDays = getRemainingDays(activeOwnedFrame?.expirationDate);
    const activeFrame = (user.activeFrameId && activeOwnedFrame && remainingDays && remainingDays > 0)
        ? avatarFrames.find(f => f.id === user.activeFrameId)
        : null;
    const ActiveFrameComponent = activeFrame ? activeFrame.component : null;
    const frameGlowClass = getFrameGlowClass(user.activeFrameId);


    return (
        <div 
            key={message.id} 
            className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : ''} ${isObservable ? 'message-bubble-observable' : ''} ${message.status === 'failed' ? 'opacity-70' : ''}`}
            data-message-id={message.id}
        >
            <div className="relative w-10 h-10 flex-shrink-0">
                <img src={user.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" />
                {ActiveFrameComponent && (
                    <div className={`absolute -top-1 -left-1 w-12 h-12 pointer-events-none ${frameGlowClass}`}>
                        <ActiveFrameComponent />
                    </div>
                )}
                 {!isMe && message.translatedText && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsTranslated(prev => !prev); }}
                        className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-800/80 border border-gray-600 rounded-full flex items-center justify-center text-white/80 hover:bg-gray-700 transition-colors"
                        aria-label="Traduzir mensagem"
                    >
                        <TranslateIcon className="w-3 h-3" />
                    </button>
                )}
            </div>
            <div className={`w-fit max-w-xs md:max-w-md rounded-2xl shadow-lg shadow-black/50 ${isMe ? 'bg-purple-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'} ${message.imageUrl && !message.text ? 'p-1' : 'px-3 py-2'}`}>
                {message.imageUrl && (
                    <button
                        onClick={() => onImageClick(message.imageUrl!)}
                        className={`focus:outline-none rounded-lg overflow-hidden transition-transform hover:scale-105 active:scale-95 ${message.text ? 'mb-2' : ''}`}
                        aria-label="View image full screen"
                    >
                        <img 
                            src={message.imageUrl} 
                            alt="Chat attachment" 
                            className="w-24 object-cover bg-black/20"
                        />
                    </button>
                )}
                {message.text && (
                     <div className="flow-root">
                        <div className="float-right ml-2 -mb-1 flex items-center space-x-1 relative top-1">
                            <span className="text-xs text-gray-300/70 whitespace-nowrap">{formatTimestamp(message.timestamp)}</span>
                            {isMe && <MessageStatus status={message.status} />}
                        </div>
                        <p className="text-white break-words text-left">{isTranslated ? message.translatedText : message.text}</p>
                    </div>
                )}
                {!message.text && message.imageUrl && (
                     <div className="flex justify-end items-center space-x-1 mt-1 px-2 pb-1">
                        <span className="text-xs text-gray-300/70 whitespace-nowrap">{formatTimestamp(message.timestamp)}</span>
                        {isMe && <MessageStatus status={message.status} />}
                    </div>
                )}
            </div>
        </div>
    );
};

const BecameFriendsIndicator: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => {
    const { t } = useTranslation();
    return (
        <div className="flex justify-center my-4">
            <button onClick={onNavigate} className="bg-gray-700/80 text-gray-300 text-sm px-4 py-2 rounded-full flex items-center space-x-2 hover:bg-gray-600 transition-colors">
                <UserIcon className="w-5 h-5" /> 
                <span>{t('chat.becameFriends')}</span>
            </button>
        </div>
    );
};


function ChatScreen({ user, onBack, isModal, currentUser, onNavigateToFriends, onFollowUser, onBlockUser, onReportUser, onOpenPhotoViewer }: ChatScreenProps): React.ReactElement {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [userStatus, setUserStatus] = useState<{ isOnline?: boolean; lastSeen?: string } | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t, language } = useTranslation();
    const chatKey = useMemo(() => createChatKey(currentUser.id, user.id), [currentUser.id, user.id]);
    const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);

    const formatLastSeen = (timestamp?: string) => {
        if (!timestamp) return 'Offline';
        const now = new Date();
        const lastSeenDate = new Date(timestamp);
        const diffSeconds = Math.round((now.getTime() - lastSeenDate.getTime()) / 1000);

        if (diffSeconds < 60) return t('common.online');
        if (diffSeconds < 3600) return `Visto por último há ${Math.floor(diffSeconds / 60)} min`;
        if (diffSeconds < 86400) return `Visto por último há ${Math.floor(diffSeconds / 3600)} horas`;
        return `Visto por último em ${lastSeenDate.toLocaleDateString()}`;
    };

    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [fetchedMessages, status] = await Promise.all([
                api.getChatMessages(user.id),
                api.getUserStatus(user.id)
            ]);
            setMessages(fetchedMessages || []);
            setUserStatus(status);
        } catch (error) {
            console.error("Failed to fetch initial chat data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        const handleNewMessage = async (message: Message & { tempId?: string }) => {
            if (message.chatId === chatKey) {
                let messageToUpdate = { ...message };

                // Translate if it's an incoming message with text
                if (message.from !== currentUser.id && message.text) {
                     try {
                        const translationResponse = await api.translate(message.text, language);
                        messageToUpdate.translatedText = translationResponse.translatedText;
                    } catch (error) {
                        console.error("Failed to translate message:", error);
                    }
                }

                setMessages(prev => {
                    const tempId = message.tempId;
                    if (tempId && prev.some(m => m.id === tempId)) {
                        return prev.map(m => (m.id === tempId ? { ...messageToUpdate, tempId: undefined } : m));
                    }
                    else if (!prev.some(m => m.id === message.id)) {
                        return [...prev, messageToUpdate];
                    }
                    return prev;
                });
            }
        };

        webSocketManager.on('newMessage', handleNewMessage);
        return () => {
            webSocketManager.off('newMessage', handleNewMessage);
        };
    }, [chatKey, currentUser.id, language]);
    
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const messageIdsToRead: string[] = [];
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const messageId = (entry.target as HTMLElement).dataset.messageId;
                        if(messageId) {
                            messageIdsToRead.push(messageId);
                            observer.unobserve(entry.target);
                        }
                    }
                });

                if (messageIdsToRead.length > 0) {
                    // Optimistically update UI
                    setMessages(prev => prev.map(m => 
                        messageIdsToRead.includes(m.id) ? { ...m, status: 'read' } : m
                    ));
                    // Inform the server
                    api.markMessagesAsRead(messageIdsToRead, currentUser.id);
                }
            },
            { threshold: 0.8 }
        );

        document.querySelectorAll('.message-bubble-observable').forEach(el => {
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, [messages, currentUser.id]);


    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setSelectedImage(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
        if(event.target) event.target.value = '';
    };

    const handleSendMessage = async () => {
        const hasText = newMessage.trim() !== '';
        const hasImage = !!selectedImage;
        const sendingMessage = messages.some(m => m.status === 'sending');

        if ((!hasText && !hasImage) || sendingMessage) return;
        
        const textToSend = newMessage;
        const imageToSend = selectedImage;

        const tempId = `temp_${Date.now()}`;
        const optimisticMessage: Message = {
            id: tempId,
            chatId: chatKey,
            from: currentUser.id,
            to: user.id,
            text: textToSend,
            imageUrl: imageToSend || undefined,
            timestamp: new Date().toISOString(),
            status: 'sending',
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');
        setSelectedImage(null);

        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            setTimeout(() => {
                chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
        }

        try {
            let finalImageUrl: string | undefined = undefined;
            if (imageToSend) {
                const uploadResponse = await api.uploadChatPhoto(user.id, imageToSend);
                if (uploadResponse?.url) {
                    finalImageUrl = uploadResponse.url;
                } else {
                    throw new Error("Image upload failed");
                }
            }
            
            await api.sendChatMessage(currentUser.id, user.id, textToSend, finalImageUrl, tempId);

        } catch (error) {
            console.error("Failed to send message:", error);
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
        }
    };
    
    const handleViewImage = (clickedUrl: string) => {
        const imageMessages = messages.filter(m => m.imageUrl);
        const photoFeed: FeedPhoto[] = imageMessages.map(m => ({
            id: m.id,
            photoUrl: m.imageUrl!,
            type: 'image',
            user: m.from === currentUser.id ? currentUser : user,
            likes: 0, 
            isLiked: false, 
            // FIX: Add missing 'commentCount' property.
            commentCount: 0,
        }));

        const initialIndex = photoFeed.findIndex(p => p.photoUrl === clickedUrl);

        if (initialIndex !== -1) {
            onOpenPhotoViewer(photoFeed, initialIndex);
        }
    };

    const containerClasses = isModal
        ? "absolute inset-0 z-[70] flex items-end justify-center"
        : "absolute inset-0 z-50 bg-[#1C1C1E] text-white flex flex-col";

    const contentClasses = isModal
        ? "bg-[#1C1C1E] text-white flex flex-col w-full max-w-md h-[75%] rounded-t-2xl"
        : "text-white flex flex-col w-full h-full";
        
    const backdropClick = isModal ? onBack : undefined;

    return (
        <div className={containerClasses} onClick={backdropClick}>
            <div 
                className={contentClasses}
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0">
                    <button onClick={onBack} className="p-2 -ml-2">
                        <BackIcon className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col items-center">
                        <h1 className="font-bold text-lg flex items-center space-x-2">
                            <span>{user.name}</span>
                            {user.isLive && <LiveIndicatorIcon className="w-4 h-4 text-red-500" />}
                        </h1>
                        <span className={`text-xs ${userStatus?.isOnline ? 'text-green-400' : 'text-gray-500'}`}>
                            {userStatus?.isOnline ? t('common.online') : formatLastSeen(userStatus?.lastSeen)}
                        </span>
                    </div>
                    {user.id !== 'support-livercore' ? (
                        <button onClick={() => setIsActionsModalOpen(true)} className="p-2 -mr-2">
                            <ThreeDotsIcon className="w-6 h-6" />
                        </button>
                    ) : (
                        <div className="w-6 h-6 p-2 -mr-2"></div> 
                    )}
                </header>
                <main className="flex-grow p-4 overflow-y-auto no-scrollbar flex flex-col">
                    {isLoading ? (
                        <div className="flex-grow flex items-center justify-center">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <div className="space-y-4 mt-auto">
                            {messages.map((msg) => {
                                if (msg.type === 'system-friend-notification') {
                                    return <BecameFriendsIndicator key={msg.id} onNavigate={onNavigateToFriends} />;
                                }
                                return (
                                    <ChatMessageBubble
                                        key={msg.id}
                                        message={msg}
                                        isMe={msg.from === currentUser.id}
                                        user={msg.from === currentUser.id ? currentUser : user}
                                        onImageClick={handleViewImage}
                                    />
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>
                    )}
                </main>
                <footer className="p-3 bg-[#111111] border-t border-gray-800 flex-shrink-0">
                    {selectedImage && (
                        <div className="relative p-2 mb-2 w-fit">
                            <img src={selectedImage} alt="Preview" className="max-h-24 rounded-lg" />
                            <button 
                                onClick={() => setSelectedImage(null)}
                                className="absolute -top-1 -right-1 bg-black/50 text-white rounded-full p-0.5"
                            >
                                <CloseIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center space-x-2">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleImageSelect}
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-[#2C2C2E] text-gray-400 hover:bg-gray-700/50 rounded-lg transition-colors flex items-center justify-center w-11 h-11 flex-shrink-0"
                        >
                            <GalleryIcon className="w-6 h-6" />
                        </button>
                        <div className="flex-grow bg-[#2C2C2E] rounded-lg h-11 transition-shadow">
                            <input
                                type="text"
                                placeholder={t('chat.sayHi')}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                className="w-full h-full bg-transparent text-white placeholder-gray-500 px-4 focus:outline-none"
                            />
                        </div>
                        <button 
                            onClick={handleSendMessage}
                            className="bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors flex items-center justify-center w-11 h-11 flex-shrink-0 disabled:bg-gray-600 disabled:cursor-not-allowed"
                            disabled={(!newMessage.trim() && !selectedImage) || messages.some(m => m.status === 'sending')}
                        >
                            {messages.some(m => m.status === 'sending') ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                            ) : (
                                <SendIcon className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </footer>
            </div>
            <BlockReportModal
                isOpen={isActionsModalOpen}
                onClose={() => setIsActionsModalOpen(false)}
                onUnfriend={user.isFollowed ? () => {
                    onFollowUser(user);
                    setIsActionsModalOpen(false);
                    onNavigateToFriends();
                } : undefined}
                onBlock={() => {
                    onBlockUser(user);
                    setIsActionsModalOpen(false);
                    onBack();
                }}
                onReport={() => {
                    onReportUser(user);
                    setIsActionsModalOpen(false);
                }}
            />
        </div>
    );
}

export default ChatScreen;