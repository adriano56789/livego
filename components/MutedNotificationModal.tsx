
import React, { useEffect } from 'react';
import BlockedIcon from './icons/BlockedIcon';
import BellIcon from './icons/BellIcon';

interface MutedNotificationModalProps {
  type: 'muted' | 'unmuted';
  onClose: () => void;
}

const MutedNotificationModal: React.FC<MutedNotificationModalProps> = ({ type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000); // Auto-dismiss after 3 seconds
        return () => clearTimeout(timer);
    }, [onClose]);

    const isMuted = type === 'muted';

    return (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 w-full max-w-sm p-2 z-50 animate-slide-down-fade">
            <div className={`bg-gradient-to-br ${isMuted ? 'from-red-800 to-red-900' : 'from-green-800 to-green-900'} rounded-xl p-3 shadow-2xl border ${isMuted ? 'border-red-500/30' : 'border-green-500/30'} flex items-center gap-3`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-500/50' : 'bg-green-500/50'}`}>
                    {isMuted ? <BlockedIcon className="w-6 h-6 text-white" /> : <BellIcon className="w-6 h-6 text-white" />}
                </div>
                <div>
                    <p className="font-bold text-white">{isMuted ? 'Você foi silenciado' : 'Você não está mais silenciado'}</p>
                    <p className="text-sm text-gray-300">{isMuted ? 'Você não pode enviar mensagens.' : 'Agora você pode enviar mensagens.'}</p>
                </div>
            </div>
            <style>{`
                @keyframes slide-down-fade {
                0% { opacity: 0; transform: translate(-50%, -20px); }
                100% { opacity: 1; transform: translate(-50%, 0); }
                }
                .animate-slide-down-fade { animation: slide-down-fade 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default MutedNotificationModal;
