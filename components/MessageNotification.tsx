import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { CloseIcon } from './icons';

interface MessageNotificationProps {
    message: {
        senderName: string;
        senderAvatar: string;
        text: string;
        timestamp: string;
    };
    onClose: () => void;
}

const MessageNotification: React.FC<MessageNotificationProps> = ({ message, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Animar entrada
        setTimeout(() => setIsVisible(true), 100);
        
        // Auto-fechar após 5 segundos
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-20 right-4 z-[1000] bg-black/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/10 max-w-sm transform transition-all duration-300 ease-out ${
            isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}>
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <img 
                    src={message.senderAvatar || `https://picsum.photos/seed/${message.senderName}/40/40.jpg`}
                    alt={message.senderName}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                
                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h4 className="text-white font-semibold text-sm truncate">{message.senderName}</h4>
                        <button 
                            onClick={() => {
                                setIsVisible(false);
                                setTimeout(onClose, 300);
                            }}
                            className="text-white/60 hover:text-white transition-colors p-0.5 rounded-full hover:bg-white/10"
                        >
                            <CloseIcon className="w-3 h-3" />
                        </button>
                    </div>
                    
                    <p className="text-white/80 text-sm line-clamp-2 break-words">
                        {message.text}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-white/60 text-xs">Nova mensagem</span>
                    </div>
                </div>
            </div>
            
            {/* Indicador animado */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse"></div>
        </div>
    );
};

export default MessageNotification;
