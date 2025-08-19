
import React, { useState } from 'react';
import type { PkInvitation, User } from '../types';
import SparkleIcon from './icons/SparkleIcon';
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
          <div className="flex items-center justify-between">
            {/* Inviter */}
            <div className="flex items-center gap-2">
              <SparkleIcon className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-semibold">{invitation.inviterName}</span>
              <img src={invitation.inviterAvatarUrl} alt={invitation.inviterName} className="w-12 h-12 rounded-full object-cover"/>
            </div>
            
            {/* Invitee */}
            <div className="flex items-center gap-2">
              <img src={currentUser.avatar_url} alt={currentUser.nickname || ''} className="w-12 h-12 rounded-full object-cover"/>
              <span className="text-sm font-semibold">{currentUser.nickname}</span>
            </div>
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
             <PkBlobsIcon />
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
