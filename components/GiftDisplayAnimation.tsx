import React, { useState, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { Player } from '@lottiefiles/react-lottie-player';
import * as authService from '../services/authService';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';

interface GiftQueueItem {
  id: number;
  animationUrl: string;
  senderName: string;
  senderAvatarUrl: string;
  giftName: string;
}

interface GiftDisplayAnimationProps {
  triggeredGift: ChatMessage | null;
}

const GiftDisplayAnimation: React.FC<GiftDisplayAnimationProps> = ({ triggeredGift }) => {
  const [giftQueue, setGiftQueue] = useState<GiftQueueItem[]>([]);
  const [currentGift, setCurrentGift] = useState<GiftQueueItem | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (triggeredGift && triggeredGift.giftAnimationUrl) {
      const fetchAvatarAndAddToQueue = async () => {
        let avatarUrl = '';
        try {
          const profile = await authService.getUserProfile(triggeredGift.userId);
          avatarUrl = profile.avatar_url || '';
        } catch (e) {
          console.error("Failed to fetch sender avatar for gift display:", e);
        }
        
        const newGift: GiftQueueItem = {
          id: triggeredGift.id,
          animationUrl: triggeredGift.giftAnimationUrl,
          senderName: triggeredGift.username,
          senderAvatarUrl: avatarUrl,
          giftName: triggeredGift.giftName || 'um presente',
        };

        setGiftQueue(prev => [...prev, newGift]);
      };
      fetchAvatarAndAddToQueue();
    }
  }, [triggeredGift]);

  useEffect(() => {
    if (!currentGift && giftQueue.length > 0) {
      const nextGift = giftQueue[0];
      setCurrentGift(nextGift);
      setGiftQueue(prev => prev.slice(1));
      setIsVisible(true);

      // Animation duration: 0.5s in, 2s visible, 0.5s out
      const fadeOutTimer = setTimeout(() => {
        setIsVisible(false);
      }, 2500);

      const cleanupTimer = setTimeout(() => {
        setCurrentGift(null);
      }, 3000);

      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(cleanupTimer);
      };
    }
  }, [currentGift, giftQueue]);

  if (!currentGift) {
    return null;
  }

  return (
    <div
      className={`fixed top-1/2 left-1/2 z-30 pointer-events-none flex flex-col items-center gap-4 ${isVisible ? 'animate-gift-display-in' : 'animate-gift-display-out'}`}
      style={{ transform: 'translate(-50%, -50%)' }}
    >
      <Player
        src={currentGift.animationUrl}
        className="w-48 h-48"
        autoplay
        keepLastFrame
      />
      <div className="bg-black/60 backdrop-blur-sm p-2 pr-4 rounded-full flex items-center gap-3 shadow-lg -mt-8">
        <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
            {currentGift.senderAvatarUrl ? (
                <img src={currentGift.senderAvatarUrl} alt={currentGift.senderName} className="w-full h-full object-cover" />
            ) : (
                <UserPlaceholderIcon className="w-full h-full text-gray-500 p-1" />
            )}
        </div>
        <div className="text-white text-sm">
          <p className="font-bold">{currentGift.senderName}</p>
          <p className="text-xs text-gray-300">enviou {currentGift.giftName}!</p>
        </div>
      </div>
    </div>
  );
};

export default GiftDisplayAnimation;
