
import React from 'react';
import { CloseIcon } from '../icons';

interface ChatConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChatConfigModal: React.FC<ChatConfigModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20" onClick={onClose}>
            <div className="w-full bg-[#1C1C1E] rounded-t-2xl p-5 animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-bold">Configurações de Chat</h3>
                    <button onClick={onClose}><CloseIcon className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="space-y-4 pb-8">
                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                        <span className="text-gray-300 text-sm">Filtrar Spam</span>
                        <div className="w-10 h-5 bg-purple-600 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                        <span className="text-gray-300 text-sm">Traduzir Automático</span>
                        <div className="w-10 h-5 bg-gray-700 rounded-full"></div>
                    </div>
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-4">Preferências salvas localmente</p>
                </div>
            </div>
        </div>
    );
};

export default ChatConfigModal;
