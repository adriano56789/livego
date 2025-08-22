import React, { useState } from 'react';
import type { User, UniversalRankingUser } from '../types';
import DiamondIcon from './icons/DiamondIcon';
import * as liveStreamService from '../services/liveStreamService';
import { useApiViewer } from './ApiContext';

interface HelpRankingModalProps {
  currentUser: User;
  targetUser: UniversalRankingUser;
  giftValue: number;
  secondaryText: string;
  onClose: () => void;
  onConfirm: (updatedUser: User) => void;
  onRequirePurchase: () => void;
}

const HelpRankingModal: React.FC<HelpRankingModalProps> = ({
  currentUser,
  targetUser,
  giftValue,
  secondaryText,
  onClose,
  onConfirm,
  onRequirePurchase,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showApiResponse } = useApiViewer();

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const { updatedUser, success, message } = await liveStreamService.helpHostRankUp(currentUser.id, targetUser.userId, giftValue);
      showApiResponse('POST /api/ranking/help-host', { success, message, giftValue });
      if (success && updatedUser) {
        onConfirm(updatedUser);
      } else {
        if (message.includes('insuficientes')) {
          onRequirePurchase();
        } else {
          alert(message);
        }
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Ocorreu um erro.');
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  const getFlagEmoji = (user: UniversalRankingUser | User) => {
      if ('badges' in user) {
          const flagBadge = user.badges.find(b => b.type === 'flag');
          if (flagBadge) return flagBadge.value;
      }
      return '🇧🇷'; // Default flag for current user if not in ranking
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4 font-sans" onClick={onClose}>
      <div
        className="relative bg-white w-full max-w-sm rounded-2xl p-6 text-center text-black flex flex-col items-center overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Confetti background */}
        <div className="absolute inset-0 z-0">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="absolute w-2 h-2 rounded-full" style={{
              backgroundColor: ['#f472b6', '#a78bfa', '#60a5fa', '#34d399'][i % 4],
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              transform: `scale(${Math.random() * 0.5 + 0.5})`,
              opacity: `${Math.random() * 0.5 + 0.3}`
            }} />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center justify-center -space-x-6 mb-4">
             <div className="relative">
                <img src={currentUser.avatar_url} alt={currentUser.name} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
                <span className="absolute bottom-0 right-0 text-2xl">{getFlagEmoji(currentUser)}</span>
             </div>
            <div className="relative">
                 <img src={targetUser.avatarUrl} alt={targetUser.name} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
                 <span className="absolute bottom-0 right-0 text-2xl">{getFlagEmoji(targetUser)}</span>
            </div>
          </div>

          <p className="font-semibold text-lg text-gray-800 flex items-center gap-2">
            Envie um presente no valor de <DiamondIcon className="w-6 h-6 inline-block" /> {giftValue}
          </p>
          <p className="text-gray-500 mt-2">{secondaryText}</p>

          <div className="w-full mt-6 space-y-3">
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-full text-lg transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              {isSubmitting ? 'Enviando...' : 'OK'}
            </button>
            <button onClick={onClose} className="w-full font-semibold text-gray-500 py-2">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpRankingModal;
