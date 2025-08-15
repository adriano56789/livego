import React, { useState, useEffect } from 'react';
import type { DailyReward } from '../types';

interface RewardClaimModalProps {
  reward: DailyReward;
  onClose: () => void;
}

const RewardClaimModal: React.FC<RewardClaimModalProps> = ({ reward, onClose }) => {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsRevealed(true), 100); // Short delay for animation
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="relative bg-gradient-to-br from-[#302B63] to-[#0F0C29] w-full max-w-sm rounded-2xl p-6 text-center text-white border-2 border-purple-400/50 shadow-lg shadow-purple-500/20"
        onClick={e => e.stopPropagation()}
      >
        {isRevealed && (
             <div className="absolute inset-0 overflow-hidden rounded-2xl">
                {Array.from({ length: 50 }).map((_, i) => (
                    <div 
                        key={i}
                        className="absolute bg-yellow-300 rounded-full animate-confetti"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${-20 + Math.random() * 40}%`,
                            width: `${Math.random() * 8 + 4}px`,
                            height: `${Math.random() * 8 + 4}px`,
                            animationDelay: `${Math.random() * 2}s`,
                            opacity: Math.random() * 0.5 + 0.5,
                        }}
                    ></div>
                ))}
            </div>
        )}

        <div className={`relative transition-all duration-500 ${isRevealed ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
            <h2 className="text-2xl font-bold">Você ganhou!</h2>
            
            <div className="my-6 flex flex-col items-center justify-center">
                <div className="w-28 h-28 flex items-center justify-center animate-reward-appear">
                    <img src={reward.imageUrl} alt={reward.name} className="max-w-full max-h-full object-contain drop-shadow-lg" />
                </div>
                <p className="text-xl font-semibold mt-4">{reward.name}</p>
            </div>
            
            <button
            onClick={onClose}
            className="w-full bg-green-500 text-black font-bold py-3 rounded-full text-lg transition-transform hover:scale-105"
            >
            Legal!
            </button>
        </div>
      </div>
      <style>{`
        @keyframes confetti-fall {
            0% { transform: translateY(0) rotate(0); }
            100% { transform: translateY(120vh) rotate(360deg); }
        }
        .animate-confetti {
            animation: confetti-fall 3s linear infinite;
        }
        @keyframes reward-appear {
            0% { transform: scale(0.5) rotate(-15deg); opacity: 0; }
            50% { transform: scale(1.1) rotate(10deg); opacity: 1; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-reward-appear {
            animation: reward-appear 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default RewardClaimModal;
