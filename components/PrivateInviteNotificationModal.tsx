import React, { useEffect } from 'react';
import { User, Streamer } from '../types';
import { CheckIcon, CloseIcon } from './icons';

interface InviteData {
    fromUser: User;
    streamData: Streamer;
}

interface PrivateInviteNotificationModalProps {
    inviteData: InviteData;
    onAccept: () => void;
    onDecline: () => void;
}

const PrivateInviteNotificationModal: React.FC<PrivateInviteNotificationModalProps> = ({ inviteData, onAccept, onDecline }) => {
    
    useEffect(() => {
        const timer = setTimeout(() => {
            onDecline();
        }, 8000); // Auto-decline after 8 seconds

        return () => clearTimeout(timer);
    }, [onDecline]);

    if (!inviteData) return null;

    return (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] rounded-2xl p-4 shadow-2xl border border-purple-400/30 flex items-center gap-4">
                <img src={inviteData.fromUser.avatarUrl} alt={inviteData.fromUser.name} className="w-12 h-12 rounded-full border-2 border-purple-400 object-cover" />
                <div className="flex-1">
                    <p className="text-white font-bold text-sm">{inviteData.fromUser.name}</p>
                    <p className="text-purple-200 text-xs">convida você para uma sala privada.</p>
                </div>
                <div className="flex flex-col gap-2">
                    <button onClick={onAccept} className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg">
                        <CheckIcon className="w-5 h-5" />
                    </button>
                    <button onClick={onDecline} className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrivateInviteNotificationModal;