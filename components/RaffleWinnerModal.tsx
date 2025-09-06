import React, { useEffect, useState } from 'react';
import type { RaffleParticipant } from '../types';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';

interface RaffleWinnerModalProps {
  winners: RaffleParticipant[];
  prize: string;
  onClose: () => void;
}

const RaffleWinnerModal: React.FC<RaffleWinnerModalProps> = ({ winners, prize, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 4500);

    const closeTimer = setTimeout(() => {
      onClose();
    }, 5000); // 5 seconds total duration

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  return (
    <div className={`fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4 font-sans ${isExiting ? 'animate-fade-out-fast' : 'animate-fade-in-fast'}`} onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-purple-900 via-indigo-900 to-gray-900 border-2 border-yellow-400/50 rounded-2xl w-full max-w-sm p-6 text-center text-white flex flex-col items-center shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-yellow-300 drop-shadow-lg">VENCEDORES!</h2>
        <p className="text-gray-300 mt-2">Parabéns aos vencedores do sorteio de</p>
        <p className="text-xl font-bold text-yellow-300 my-2">"{prize}"</p>
        
        <div className="w-full max-h-48 overflow-y-auto scrollbar-hide my-4 space-y-2 bg-black/20 p-2 rounded-lg">
          {winners.map(winner => (
            <div key={winner.userId} className="flex items-center gap-3 p-2 bg-white/10 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden shrink-0">
                {winner.avatarUrl ? (
                    <img src={winner.avatarUrl} alt={winner.username} className="w-full h-full object-cover" />
                ) : (
                    <UserPlaceholderIcon className="w-full h-full p-1 text-gray-400" />
                )}
              </div>
              <p className="font-semibold text-left truncate">{winner.username}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RaffleWinnerModal;