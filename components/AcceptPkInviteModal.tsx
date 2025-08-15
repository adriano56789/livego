import React from 'react';
import type { PkInvitation } from '../types';
import SwordsIcon from './icons/SwordsIcon';

interface AcceptPkInviteModalProps {
  invitation: PkInvitation;
  onAccept: () => void;
  onDecline: () => void;
}

const AcceptPkInviteModal: React.FC<AcceptPkInviteModalProps> = ({ invitation, onAccept, onDecline }) => {
  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 font-sans">
      <div className="bg-gradient-to-br from-[#1E1B4B] to-[#141026] rounded-2xl p-6 text-center w-full max-w-sm animate-fade-in-fast border border-purple-500/50">
        <div className="flex justify-center items-center -space-x-4 mb-4">
            <img src={invitation.inviterAvatarUrl} alt={invitation.inviterName} className="w-20 h-20 rounded-full object-cover border-2 border-purple-400" />
            <SwordsIcon className="w-16 h-16 text-red-500" />
            <div className="w-20 h-20 rounded-full bg-gray-700 border-2 border-purple-400"></div>
        </div>
        <h2 className="text-xl font-bold text-white">Convite para Batalha PK!</h2>
        <p className="text-gray-300 mt-2">
            <span className="font-semibold text-purple-300">{invitation.inviterName}</span> te desafiou para uma batalha!
        </p>
        <div className="flex gap-4 mt-6">
          <button
            onClick={onDecline}
            className="w-full bg-[#2c2c2e] text-white font-semibold py-3 rounded-full hover:bg-[#3a3a3c] transition-colors"
          >
            Recusar
          </button>
          <button
            onClick={onAccept}
            className="w-full bg-red-600 text-white font-semibold py-3 rounded-full hover:bg-red-500 transition-colors"
          >
            Aceitar
          </button>
        </div>
      </div>
       <style>{`
        @keyframes fade-in-fast { 
            from { opacity: 0; transform: scale(0.95); } 
            to { opacity: 1; transform: scale(1); } 
        }
        .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AcceptPkInviteModal;