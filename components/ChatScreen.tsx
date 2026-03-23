import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { User, Message, FeedPhoto } from '../types';
import { BackIcon, ThreeDotsIcon, SendIcon, GalleryIcon, CheckIcon, DoubleCheckIcon, UserIcon, CloseIcon, LiveIndicatorIcon, ClockIcon, WarningTriangleIcon } from './icons';
import BlockReportModal from './BlockReportModal';
import { useTranslation } from '../i18n';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';
import { socketService } from '../services/socket';

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

    // Simplificado - sem frames para navegação isolada
    const frameGlowClass = '';

    // Usar dados do remetente da API se disponíveis, senão usar dados do user prop
    const senderName = message.senderName || user.name;
    const senderAvatar = message.senderAvatar || user.avatarUrl;
    const senderAge = message.senderAge || user.age;
    const senderLevel = message.senderLevel || user.level;
    const senderIdentification = message.senderIdentification || user.identification;
    const senderBirthday = message.senderBirthday || user.birthday;

    // Verificar se hoje é aniversário
    const isBirthday = () => {
        if (!senderBirthday) return false;
        const today = new Date();
        const birthday = new Date(senderBirthday);
        return today.getDate() === birthday.getDate() && 
               today.getMonth() === birthday.getMonth();
    };

    return (
        <div
            key={message.id}
            className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : ''} ${isObservable ? 'message-bubble-observable' : ''} ${message.status === 'failed' ? 'opacity-70' : ''}`}
            data-message-id={message.id}
        >
            <div className="relative w-10 h-10 flex-shrink-0">
                <img src={senderAvatar || `https://picsum.photos/seed/${senderName || 'support'}/200/200.jpg`} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
            </div>
            <div className={`max-w-xs md:max-w-md rounded-2xl ${isMe ? 'bg-purple-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'} ${message.imageUrl && !message.text ? 'p-1' : 'px-3 py-2'}`}>
                {!isMe && (senderName || senderLevel) && (
                    <div className="flex items-center gap-2 mb-1 text-xs text-gray-300">
                        {senderName && <span className="font-medium">{senderName}</span>}
                        {senderLevel && <span className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full">Nível {senderLevel}</span>}
                        {isBirthday() && <span className="text-pink-400">🎂</span>}
                        {senderAge && <span className="text-gray-400">{senderAge} anos</span>}
                        {senderIdentification && <span className="text-gray-400">ID: {senderIdentification}</span>}
                    </div>
                )}
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
                        <p className="text-white break-words">{message.text}</p>
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


const ChatScreen: React.FC<ChatScreenProps> = ({ user, onBack, isModal, currentUser, onNavigateToFriends, onFollowUser, onBlockUser, onReportUser, onOpenPhotoViewer }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [userStatus, setUserStatus] = useState<{ isOnline?: boolean; lastSeen?: string } | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();
    const chatKey = useMemo(() => `chat_${currentUser.id}_${user.id}`, [currentUser.id, user.id]);
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
        } finally {
            setIsLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        const handleNewMessage = (message: Message & { tempId?: string }) => {
            if (message.chatId === chatKey || (message.from === user.id && message.to === currentUser.id) || (message.from === currentUser.id && message.to === user.id)) {
                setMessages(prev => {
                    const tempId = message.tempId;
                    // If it's an ack for an optimistic message, replace it
                    if (tempId && prev.some(m => m.id === tempId)) {
                        return prev.map(m => (m.id === tempId ? { ...message, tempId: undefined } : m));
                    }
                    // If it's a new message from the other user, or a duplicate broadcast (already replaced)
                    else if (!prev.some(m => m.id === message.id)) {
                        return [...prev, message];
                    }
                    return prev; // It's a duplicate, do nothing
                });
            }
        };

        socketService.on('newMessage', handleNewMessage);
        return () => {
            socketService.off('newMessage', handleNewMessage);
        };
    }, [chatKey, currentUser.id, user.id]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const messageIdsToRead: string[] = [];
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const messageId = (entry.target as HTMLElement).dataset.messageId;
                        if (messageId) {
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
        if (event.target) event.target.value = '';
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
            status: 'sending' as 'sent', // Casting for type compatibility until status is widened
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
                // Convert the data URL to base64 string for the API
                const base64Data = imageToSend.includes('base64,')
                    ? imageToSend.split('base64,')[1]
                    : imageToSend;

                const uploadResponse = await api.uploadChatPhoto(user.id, base64Data) as { url: string };
                if (uploadResponse?.url) {
                    finalImageUrl = uploadResponse.url;
                } else {
                    throw new Error("Image upload failed");
                }
            }

            const result = await api.sendChatMessage(currentUser.id, user.id, textToSend, finalImageUrl, tempId);

            if (result && result.message) {
                // Update the optimistic message with the real one and status 'sent'
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === tempId
                            ? { ...result.message, status: 'sent' as 'sent' }
                            : msg
                    )
                );
            } else {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === tempId
                            ? { ...msg, status: 'failed' as 'failed' }
                            : msg
                    )
                );
            }
        } catch (error) {
            // Revert optimistic update on failure, or show failed status
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === tempId
                        ? { ...msg, status: 'failed' as 'failed' }
                        : msg
                )
            );
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        try {
            await api.deleteMessage(messageId, currentUser.id);
            // Substituir mensagem por "mensagem excluída"
            setMessages(prev => prev.map(msg => 
                msg.id === messageId 
                    ? { ...msg, text: 'mensagem excluída', imageUrl: undefined, status: 'sent' as 'sent' }
                    : msg
            ));
        } catch (error) {
        }
    };

    const handleDeleteAllMessages = async () => {
        
        try {
            // Apagar todas as mensagens do usuário atual
            const deletePromises = messages
                .filter(msg => msg.from === currentUser.id)
                .map(msg => api.deleteMessage(msg.id, currentUser.id));
            
            await Promise.all(deletePromises);
            
            // Substituir mensagens por "mensagem excluída"
            setMessages(prev => prev.map(msg => 
                msg.from === currentUser.id 
                    ? { ...msg, text: 'mensagem excluída', imageUrl: undefined, status: 'sent' as 'sent' }
                    : msg
            ));
            
            setIsActionsModalOpen(false);
        } catch (error) {
        }
    };

    const handleViewImage = (clickedUrl: string) => {
        
        // Criar photoFeed apenas com a imagem clicada para performance
        const photoFeed: FeedPhoto[] = [{
            id: 'current-image',
            photoUrl: clickedUrl,
            user: currentUser,
            likes: 0,
            isLiked: false,
        }];


        try {
            onOpenPhotoViewer(photoFeed, 0);
        } catch (error) {
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
                        <span className={`text-xs ${(userStatus?.isOnline ?? user.isOnline) ? 'text-green-400' : 'text-gray-500'}`}>
                            {(userStatus?.isOnline ?? user.isOnline) ? t('common.online') : formatLastSeen(userStatus?.lastSeen)}
                        </span>
                    </div>
                    <button onClick={() => setIsActionsModalOpen(true)} className="p-2 -mr-2">
                        <ThreeDotsIcon className="w-6 h-6" />
                    </button>
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
                currentUser={currentUser}
                targetUser={user}
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
                onDeleteMessages={handleDeleteAllMessages}
            />
        </div>
    );
};

export default ChatScreen;
