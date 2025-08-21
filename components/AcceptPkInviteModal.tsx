import React, { useState } from 'react';
import type { PkInvitation, User } from '../types';
import PkBlobsIcon from './icons/PkBlobsIcon';

interface AcceptPkInviteModalProps {
  currentUser: User;
  invitation: PkInvitation;
  onAccept: () => void;
  onDecline: () => void;
}

const AcceptPkInviteModal: React.FC<AcceptPkInviteModalProps> = ({ currentUser, invitation, onAccept, onDecline }) => {
  const [isAccepting, setIsAccepting] = useState(false);
  
  const handleAcceptClick = () => {
    setIsAccepting(true);
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-end" onClick={onDecline}>
      <div 
        className="bg-white w-full rounded-t-2xl p-4 pt-6 text-black animate-slide-up-fast flex flex-col gap-4" 
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-center font-bold text-lg">Convite para disputa</h2>
        
        <div className="relative p-3 rounded-xl bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50">
          <div className="flex items-center justify-center gap-4">
            {/* Inviter */}
            <div className="flex-1 text-right font-semibold truncate">{invitation.inviterName}</div>
            <img src={invitation.inviterAvatarUrl} alt={invitation.inviterName} className="w-12 h-12 rounded-full object-cover shrink-0"/>
            
            {/* vs icon */}
            <div className="shrink-0">
               <PkBlobsIcon />
            </div>

            {/* Current User (Invitee) */}
            <img src={currentUser.avatar_url} alt={currentUser.nickname || ''} className="w-12 h-12 rounded-full object-cover shrink-0"/>
            <div className="flex-1 text-left font-semibold truncate">{currentUser.nickname}</div>
          </div>
        </div>

        <div className="flex items-center justify-around mt-2">
            <button onClick={onDecline} className="flex-1 py-3.5 font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                Recusar
            </button>
            <button 
                onClick={handleAcceptClick} 
                disabled={isAccepting} 
                className="flex-[2] py-3.5 rounded-full font-bold text-white bg-pink-500 hover:bg-pink-600 transition-colors disabled:opacity-70"
            >
                {isAccepting ? 'Aceitando...' : 'Aceitar'}
            </button>
        </div>
      </div>
      <style>{`
        @keyframes slide-up-fast { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up-fast { animation: slide-up-fast 0.25s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AcceptPkInviteModal;
