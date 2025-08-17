import React, { useEffect } from 'react';
import type { IncomingPrivateLiveInvite } from '../types';
import BuzzCastIcon from './icons/BuzzCastIcon';

interface IncomingPrivateLiveInviteModalProps {
  invite: IncomingPrivateLiveInvite;
  onAccept: () => void;
  onDecline: () => void;
}

const IncomingPrivateLiveInviteModal: React.FC<IncomingPrivateLiveInviteModalProps> = ({ invite, onAccept, onDecline }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDecline();
    }, 10000); // Auto-dismiss after 10 seconds

    return () => clearTimeout(timer);
  }, [onDecline]);

  return (
    <div 
      className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-[calc(100%-2rem)] sm:max-w-sm z-[100] animate-slide-down-fade"
      role="alert"
      aria-live="assertive"
    >
      <button 
        onClick={onAccept} 
        className="w-full text-left bg-white rounded-xl p-3 shadow-lg flex flex-col gap-3 text-black hover:bg-gray-100/90 transition-colors"
      >
        <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
                <BuzzCastIcon className="w-5 h-5" />
                <span className="font-semibold">Convite para Live Privada</span>
            </div>
            <span>agora</span>
        </div>
        <div className="flex items-center gap-3">
          <img src={invite.inviter.avatar_url} alt={invite.inviter.name} className="w-12 h-12 rounded-full object-cover" />
          <div className="flex-grow">
            <p className="font-semibold text-gray-800">
              {invite.inviter.nickname || invite.inviter.name}
              <span className="font-normal text-gray-600"> convidou {invite.invitee.nickname || invite.invitee.name} para assistir a live "{invite.stream.titulo}".</span>
            </p>
          </div>
        </div>
      </button>
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

export default IncomingPrivateLiveInviteModal;