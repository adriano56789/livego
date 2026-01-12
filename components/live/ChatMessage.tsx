
import React from 'react';
import { Shield } from 'lucide-react';
import { LevelBadge } from '../LevelBadge';

interface ChatMessageProps {
    userObject: any;
    message: string | React.ReactNode;
    translatedText?: string;
    onAvatarClick: () => void;
    streamerId: string;
    timestamp?: number;
}

const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    // Se for inválido, retorna vazio
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatMessage: React.FC<ChatMessageProps> = ({ userObject, message, translatedText, onAvatarClick, streamerId, timestamp }) => {
    return (
        <div className="flex items-start mb-2 animate-in slide-in-from-left-2 fade-in duration-300">
            {/* Bubble Container: Flex row keeps avatar on left, text on right */}
            <div className="bg-black/40 rounded-2xl py-2 pl-1 pr-3 inline-flex items-start gap-2 max-w-[90%]">
                
                {/* Avatar */}
                <div onClick={onAvatarClick} className="cursor-pointer flex-shrink-0">
                    <img 
                        src={userObject.avatarUrl || 'https://via.placeholder.com/32'} 
                        alt={userObject.name} 
                        className="w-8 h-8 rounded-full border border-white/20"
                    />
                </div>
                
                {/* Content: Name and Message Inline */}
                <div className="min-w-0 text-sm leading-tight pt-0.5">
                    {/* Container for inline flow */}
                    <span className="inline-flex items-center align-middle mr-1.5 -mt-0.5">
                        <LevelBadge level={userObject.level} />
                    </span>
                    <span 
                        className="text-gray-300 font-bold cursor-pointer hover:underline mr-1 align-middle opacity-90" 
                        onClick={onAvatarClick}
                    >
                        {userObject.name}
                        {userObject.isModerator && <Shield size={10} className="text-green-400 inline ml-1" />}
                    </span>
                    <span className="text-white align-middle font-normal opacity-95">
                        {message}
                    </span>
                    
                    {/* Timestamp Inline - Agora deve aparecer corretamente */}
                    {timestamp && (
                        <span className="text-white/40 text-[10px] ml-2 align-middle select-none whitespace-nowrap">
                            {formatTime(timestamp)}
                        </span>
                    )}
                    
                    {translatedText && (
                        <div className="text-gray-400 text-xs mt-1 border-t border-white/10 pt-1 italic">
                            {translatedText}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;
