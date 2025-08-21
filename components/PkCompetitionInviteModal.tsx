
import React, { useState } from 'react';
import type { PkInvitation, User } from '../types';

interface PkCompetitionInviteModalProps {
  currentUser: User;
  invitation: PkInvitation;
  onAccept: () => void;
  onDecline: () => void;
}

const PkCompetitionInviteModal: React.FC<PkCompetitionInviteModalProps> = ({ currentUser, invitation, onAccept, onDecline }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = () => {
    setIsProcessing(true);
    onAccept();
  };

  const handleDecline = () => {
    setIsProcessing(true);
    onDecline();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] bg-transparent p-4 flex justify-center pointer-events-none">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl p-4 text-black animate-slide-up-fast flex flex-col gap-4 shadow-2xl pointer-events-auto" 
      >
        <h2 className="text-center font-semibold text-base text-gray-700">Convite de competição</h2>
        
        <div className="flex items-center justify-around gap-2 my-2">
            {/* Inviter */}
            <div className="flex flex-col items-center gap-2 flex-1">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                    <img src={invitation.inviterAvatarUrl} alt={invitation.inviterName} className="w-full h-full object-cover"/>
                </div>
                <p className="font-semibold text-sm truncate w-full text-center">{invitation.inviterName}</p>
            </div>
            
            {/* VS icon */}
            <div className="shrink-0 text-center">
               <span className="font-black text-3xl italic" style={{ color: '#FF4081' }}>VS</span>
            </div>

            {/* Current User (Invitee) */}
            <div className="flex flex-col items-center gap-2 flex-1">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                    <img src={currentUser.avatar_url} alt={currentUser.nickname || ''} className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 border-2 border-pink-500 rounded-full flex items-end justify-end p-0.5">
                        <div className="w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                </div>
                <p className="font-semibold text-sm truncate w-full text-center">{currentUser.nickname}</p>
            </div>
        </div>

        <div className="flex items-center justify-around gap-3 mt-2">
            <button 
                onClick={handleDecline} 
                disabled={isProcessing}
                className="flex-1 py-3 font-semibold text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors disabled:opacity-70"
            >
                Recusar
            </button>
            <button 
                onClick={handleAccept} 
                disabled={isProcessing} 
                className="flex-[2] py-3.5 rounded-full font-bold text-white bg-pink-500 hover:bg-pink-600 transition-colors disabled:opacity-70"
            >
                {isProcessing ? 'Aguarde...' : 'Aceitar'}
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

export default PkCompetitionInviteModal;
