import React from 'react';
import { CloseIcon } from './icons';

interface PrivateInviteNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  inviterName: string;
  inviterAvatar: string;
}

const PrivateInviteNotificationModal: React.FC<PrivateInviteNotificationModalProps> = ({ isOpen, onClose, onAccept, inviterName, inviterAvatar }) => {
    if (!isOpen) return null;
    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/70">
            <div className="bg-[#2c2c2e] rounded-2xl w-full max-w-sm p-6 text-center animate-modal-enter" onClick={e => e.stopPropagation()}>
                <img src={inviterAvatar} alt={inviterName} className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-2 border-purple-400"/>
                <h2 className="text-xl font-bold text-white">{inviterName}</h2>
                <p className="text-gray-300 my-4">... te convidou para uma sala privada!</p>
                <div className="flex flex-col space-y-3">
                    <button onClick={onAccept} className="w-full bg-purple-600 text-white font-bold py-3 rounded-full hover:bg-purple-700 transition-colors">
                        Entrar na Sala
                    </button>
                    <button onClick={onClose} className="w-full text-gray-300 font-semibold py-2 rounded-full hover:bg-white/10 transition-colors">
                        Recusar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrivateInviteNotificationModal;