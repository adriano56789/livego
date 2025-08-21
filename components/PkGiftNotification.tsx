import React, { useState, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { Player } from '@lottiefiles/react-lottie-player';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';

interface PkGiftNotificationProps {
  gift: ChatMessage | null;
  senderAvatarUrl?: string;
  onAnimationEnd: () => void;
}

const PkGiftNotification: React.FC<PkGiftNotificationProps> = ({ gift, senderAvatarUrl, onAnimationEnd }) => {
  const [internalGift, setInternalGift] = useState<ChatMessage | null>(null);

  useEffect(() => {
    if (gift) {
      setInternalGift(gift);
      const timer = setTimeout(() => {
        setInternalGift(null);
        onAnimationEnd(); 
      }, 4000); // Animation duration + display time

      return () => clearTimeout(timer);
    }
  }, [gift, onAnimationEnd]);

  if (!internalGift) {
    return null;
  }

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-fade-in-out-gift"
    >
      <div className="bg-black/60 backdrop-blur-sm p-2 pr-4 rounded-full flex items-center gap-2 shadow-lg">
        <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
          {senderAvatarUrl ? (
            <img src={senderAvatarUrl} alt={internalGift.username} className="w-full h-full object-cover" />
          ) : (
            <UserPlaceholderIcon className="w-full h-full text-gray-500 p-1" />
          )}
        </div>
        <div className="text-white text-sm">
          <p className="font-bold">{internalGift.username}</p>
          <p className="text-xs text-gray-300">{internalGift.message}</p>
        </div>
        {internalGift.giftAnimationUrl && (
          <Player
            src={internalGift.giftAnimationUrl}
            className="w-14 h-14"
            autoplay
            loop
          />
        )}
      </div>
       <style>{`
        @keyframes fade-in-out-gift {
          0% { opacity: 0; transform: translate(-50%, 20px); }
          20% { opacity: 1; transform: translate(-50%, 0); }
          80% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -20px); }
        }
        .animate-fade-in-out-gift { animation: fade-in-out-gift 4s ease-in-out forwards; }
      `}</style>
    </div>
  );
};

export default PkGiftNotification;
