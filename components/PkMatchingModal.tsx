import React, { useEffect } from 'react';
import type { User } from '../types';
import SwordsIcon from './icons/SwordsIcon';

interface PkMatchingModalProps {
  currentUser: User;
  opponent: User;
  onMatchComplete: (opponent: User) => void;
}

const AvatarCircle: React.FC<{ user: User, className?: string }> = ({ user, className }) => (
    <div className={`relative w-28 h-28 rounded-full border-4 border-white/20 bg-gray-800 animate-pulse-slow ${className}`}>
        <img src={user.avatar_url} alt={user.nickname || user.name} className="w-full h-full object-cover rounded-full" />
    </div>
);

const PkMatchingModal: React.FC<PkMatchingModalProps> = ({ currentUser, opponent, onMatchComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onMatchComplete(opponent);
    }, 3000); // 3-second matching animation

    return () => clearTimeout(timer);
  }, [onMatchComplete, opponent]);

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex flex-col items-center justify-center font-sans text-white animate-fade-in-fast">
      <div className="relative w-full max-w-sm h-48 flex items-center justify-center">
        <AvatarCircle user={currentUser} className="animate-match-left" />
        <div className="absolute z-10 animate-vs-show">
            <SwordsIcon className="w-16 h-16 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]" />
        </div>
        <AvatarCircle user={opponent} className="animate-match-right" />
      </div>

      <p className="mt-8 text-xl font-semibold tracking-wider animate-pulse">
        Combinando...
      </p>

      <style>{`
        @keyframes fade-in-fast { 
            from { opacity: 0; } 
            to { opacity: 1; } 
        }
        .animate-fade-in-fast { animation: fade-in-fast 0.3s ease-out forwards; }

        @keyframes pulse-slow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        .animate-pulse-slow { animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }

        @keyframes match-left {
            0% { transform: translateX(-100px); opacity: 0; }
            40% { transform: translateX(0); opacity: 1; }
            100% { transform: translateX(0); opacity: 1; }
        }
        .animate-match-left { animation: match-left 3s ease-out forwards; }

        @keyframes match-right {
            0% { transform: translateX(100px); opacity: 0; }
            40% { transform: translateX(0); opacity: 1; }
            100% { transform: translateX(0); opacity: 1; }
        }
        .animate-match-right { animation: match-right 3s ease-out forwards; }

        @keyframes vs-show {
            0%, 50% { transform: scale(0); opacity: 0; }
            70% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
        }
        .animate-vs-show { animation: vs-show 3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default PkMatchingModal;
