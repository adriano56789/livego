import React, { useEffect, useRef } from 'react';
import type { User, PkBattle } from '../types';
import * as liveStreamService from '../services/liveStreamService';

interface PkRandomMatchModalProps {
  currentUser: User;
  onClose: () => void;
  onMatchFound: (battle: PkBattle) => void;
}

const PkRandomMatchModal: React.FC<PkRandomMatchModalProps> = ({ currentUser, onClose, onMatchFound }) => {
  const pollingInterval = useRef<number | null>(null);

  useEffect(() => {
    liveStreamService.joinPkMatchmakingQueue(currentUser.id);

    const poll = async () => {
      try {
        const { status, battle } = await liveStreamService.checkPkMatchmakingStatus(currentUser.id);
        if (status === 'pareado' && battle) {
          if (pollingInterval.current) clearInterval(pollingInterval.current);
          onMatchFound(battle);
        }
      } catch (error) {
        console.error("Error polling for match:", error);
        if (pollingInterval.current) clearInterval(pollingInterval.current);
        onClose();
      }
    };

    pollingInterval.current = window.setInterval(poll, 3000);

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      liveStreamService.leavePkMatchmakingQueue(currentUser.id);
    };
  }, [currentUser.id, onMatchFound, onClose]);

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex flex-col items-center justify-center font-sans text-white p-8 animate-fade-in-fast">
        <div className="absolute inset-0 z-0 opacity-20">
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
             <div className="relative w-32 h-32">
                <div className="absolute inset-0 rounded-full border-4 border-purple-400/50 animate-ping-slow"></div>
                <img src={currentUser.avatar_url} alt={currentUser.nickname} className="w-full h-full object-cover rounded-full" />
            </div>
            <h2 className="mt-6 text-2xl font-bold">Procurando Oponente...</h2>
            <p className="text-gray-300 mt-2">Aguarde enquanto encontramos uma batalha PK para você.</p>
        </div>

        <button 
            onClick={onClose}
            className="relative z-10 mt-12 bg-white/10 border border-white/20 text-white font-semibold py-3 px-12 rounded-full transition-colors hover:bg-white/20"
        >
            Cancelar
        </button>
        <style>{`
            @keyframes fade-in-fast { 
                from { opacity: 0; } 
                to { opacity: 1; } 
            }
            .animate-fade-in-fast { animation: fade-in-fast 0.3s ease-out forwards; }
            
            @keyframes blob {
                0% { transform: translate(-50%, -50%) scale(1); }
                33% { transform: translate(-70%, -40%) scale(1.1); }
                66% { transform: translate(-40%, -60%) scale(0.9); }
                100% { transform: translate(-50%, -50%) scale(1); }
            }
            .animate-blob { animation: blob 8s infinite ease-in-out; }
            .animation-delay-2000 { animation-delay: -4s; }

            @keyframes ping-slow {
                75%, 100% {
                    transform: scale(1.5);
                    opacity: 0;
                }
            }
            .animate-ping-slow { animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
        `}</style>
    </div>
  );
};

export default PkRandomMatchModal;
