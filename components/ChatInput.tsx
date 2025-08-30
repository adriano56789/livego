
import React, { useState, useRef } from 'react';
import SendIcon from './icons/SendIcon';
import PlusIcon from './icons/PlusIcon';


interface ChatInputProps {
    onSendMessage: (message: string) => void;
    onImageSelected?: (file: File) => void;
    allowImageUpload?: boolean;
    disabled?: boolean;
    isUploading?: boolean;
    showSendButton?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onImageSelected, allowImageUpload = true, disabled = false, isUploading = false, showSendButton = true }) => {
    const [message, setMessage] = useState('');
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && !disabled) {
            onSendMessage(message);
            setMessage('');
        }
    };
    
    const handleImageButtonClick = () => {
        if (onImageSelected) {
            imageInputRef.current?.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onImageSelected) {
            onImageSelected(file);
             // Reset the input value to allow selecting the same file again
            e.target.value = '';
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-grow">
            {allowImageUpload && onImageSelected && (
                <>
                    <input 
                        ref={imageInputRef} 
                        type="file" 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/gif" 
                        disabled={disabled || isUploading}
                    />
                     <button
                        type="button"
                        onClick={handleImageButtonClick}
                        disabled={disabled || isUploading}
                        className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 transition-colors"
                        aria-label="Anexar imagem"
                    >
                        {isUploading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <PlusIcon className="w-6 h-6 text-white" />
                        )}
                    </button>
                </>
            )}
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={disabled ? "Você está bloqueado" : "Diga oi..."}
                className="bg-black/40 w-full h-10 rounded-full px-4 text-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-shadow flex-grow disabled:bg-gray-800/50 disabled:cursor-not-allowed"
                disabled={disabled || isUploading}
            />
            {showSendButton && (
                <button
                    type="submit"
                    disabled={!message.trim() || disabled || isUploading}
                    className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0 disabled:bg-gray-500 transition-colors"
                    aria-label="Enviar mensagem"
                >
                    <SendIcon className="w-5 h-5 text-black" />
                </button>
            )}
        </form>
    );
};

export default ChatInput;