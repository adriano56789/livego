import React, { useState } from 'react';
import SendIcon from './icons/SendIcon';

interface ChatInputProps {
    onSendMessage: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(message);
            setMessage('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Diga oi..."
                className="bg-black/40 w-full h-10 rounded-full px-4 text-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-shadow flex-grow"
            />
            <button
                type="submit"
                disabled={!message.trim()}
                className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0 disabled:bg-gray-500 transition-colors"
                aria-label="Enviar mensagem"
            >
                <SendIcon className="w-5 h-5 text-black" />
            </button>
        </form>
    );
};

export default ChatInput;