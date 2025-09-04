


import React, { useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import ChatMessageItem from './ChatMessage';

interface ChatAreaProps {
    messages: ChatMessage[];
    onUserClick: (userId: number) => void;
    maxHeightClass?: string;
    isPkMode?: boolean;
}

const ChatArea: React.FC<ChatAreaProps> = ({ messages, onUserClick, maxHeightClass = 'max-h-[40vh]', isPkMode }) => {
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div ref={chatContainerRef} className={`w-full flex flex-col items-start space-y-1.5 overflow-y-auto scrollbar-hide pb-2 pointer-events-auto ${maxHeightClass}`}>
            {messages.map(msg => (
                <ChatMessageItem key={msg.id} message={msg} onUserClick={onUserClick} isPkMode={isPkMode} />
            ))}
        </div>
    );
};

export default ChatArea;