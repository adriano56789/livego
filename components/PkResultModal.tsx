
import React, { useEffect } from 'react';
import type { User, PkBattleState } from '../types';

interface PkResultModalProps {
  currentUser: User;
  battleData: PkBattleState;
  onClose: () => void;
}

const PkResultModal: React.FC<PkResultModalProps> = ({ currentUser, battleData, onClose }) => {
    const isParticipant = currentUser.id === battleData.streamer_A_id || currentUser.id === battleData.streamer_B_id;
    const isWinner = currentUser.id === battleData.vencedor_id;
    const isDraw = battleData.resultado === 'empate';

    useEffect(() => {
        const duration = 4000; // Show for 4 seconds
        
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        
        return () => clearTimeout(timer);
    }, [onClose]);

    let resultText = '';
    let resultColor = '';
    let subText = '';

    if (isDraw) {
        resultText = 'EMPATE';
        resultColor = 'text-gray-300';
        subText = "A batalha terminou em empate!";
    } else if (isParticipant) {
        if (isWinner) {
            resultText = 'VITÓRIA';
            resultColor = 'text-yellow-400';
            subText = "Você venceu a batalha!";
        } else {
            resultText = 'DERROTA';
            resultColor = 'text-red-500';
            subText = "Você perdeu a batalha.";
        }
    } else { // Spectator
        const winner = battleData.vencedor_id === battleData.streamer_A_id ? battleData.streamer_A : battleData.streamer_B;
        resultText = 'FIM DA BATALHA';
        resultColor = 'text-white';
        subText = `Vencedor: ${winner.nickname}`;
    }

    const streamer1Score = battleData.pontuacao_A;
    const streamer2Score = battleData.pontuacao_B;

    return (
        <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4 font-sans text-white animate-fade-in-fast backdrop-blur-sm">
            <div className="bg-[#1C1F24]/90 rounded-2xl w-full max-w-xs p-6 flex flex-col items-center shadow-lg">
                <h1 className={`text-3xl font-black tracking-wider ${resultColor} drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] animate-thump`}>
                    {resultText}
                </h1>

                <p className="font-semibold text-gray-300 mt-3 text-center text-sm">
                    {subText}
                </p>

                <div className="flex items-center justify-center gap-4 mt-2 text-xl font-bold">
                    <span className="text-pink-400">{streamer1Score.toLocaleString()}</span>
                    <span className="text-gray-500">VS</span>
                    <span className="text-blue-400">{streamer2Score.toLocaleString()}</span>
                </div>
            </div>

            <style>{`
                @keyframes fade-in-fast { 
                    from { opacity: 0; } 
                    to { opacity: 1; } 
                }
                .animate-fade-in-fast { animation: fade-in-fast 0.3s ease-out forwards; }

                @keyframes thump {
                    0% { transform: scale(0.5); opacity: 0; }
                    50% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-thump { animation: thump 0.6s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default PkResultModal;
