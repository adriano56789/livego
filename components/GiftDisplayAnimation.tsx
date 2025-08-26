
import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import * as authService from '../services/authService';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';

interface GiftQueueItem {
  id: number; // message id
  giftId: number;
  imageUrl: string;
  senderName: string;
  senderAvatarUrl: string;
  giftName: string;
  recipientName: string;
}

interface GiftDisplayAnimationProps {
  triggeredGift: ChatMessage | null;
}

const GiftDisplayAnimation: React.FC<GiftDisplayAnimationProps> = ({ triggeredGift }) => {
  const [giftQueue, setGiftQueue] = useState<GiftQueueItem[]>([]);
  const [currentGift, setCurrentGift] = useState<(GiftQueueItem & { combo: number }) | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const comboTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (triggeredGift?.giftImageUrl && triggeredGift.giftId && triggeredGift.recipientName) {
      // Check for combo
      if (
        currentGift &&
        isVisible && // Only combo if a gift is currently visible
        currentGift.giftId === triggeredGift.giftId &&
        currentGift.senderName === triggeredGift.username &&
        currentGift.recipientName === triggeredGift.recipientName
      ) {
        // It's a combo, update the current gift's combo count
        setCurrentGift(prev => (prev ? { ...prev, id: triggeredGift.id, combo: prev.combo + 1 } : null));
        return;
      }

      // Not a combo, so add the new gift to the queue
      const fetchAvatarAndAddToQueue = async () => {
        let avatarUrl = '';
        try {
          // Use a cached or direct avatar URL if available to avoid refetching
          const avatar = triggeredGift.avatarUrl || (await authService.getUserProfile(triggeredGift.userId)).avatar_url;
          avatarUrl = avatar || '';
        } catch (e) {
          console.error("Failed to fetch sender avatar:", e);
        }
        
        const newGift: GiftQueueItem = {
          id: triggeredGift.id,
          giftId: triggeredGift.giftId!,
          imageUrl: triggeredGift.giftImageUrl!,
          senderName: triggeredGift.username,
          senderAvatarUrl: avatarUrl,
          giftName: triggeredGift.giftName || 'um presente',
          recipientName: triggeredGift.recipientName!,
        };

        setGiftQueue(prev => [...prev, newGift]);
      };
      fetchAvatarAndAddToQueue();
    }
  }, [triggeredGift]);

  useEffect(() => {
    // This effect runs when currentGift changes (new gift or combo increment)
    // It's responsible for managing the display timers.
    if (currentGift) {
      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);

      comboTimeoutRef.current = window.setTimeout(() => {
        setIsVisible(false); // Start fade-out
      }, 2500);

      const cleanupTimer = setTimeout(() => {
        setCurrentGift(null); // Clear current gift to allow the next one in queue
        comboTimeoutRef.current = null;
      }, 3000); // 2500ms visible + 500ms fade-out animation

      return () => {
        clearTimeout(cleanupTimer);
        if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
      };

    } else if (giftQueue.length > 0) {
      // If no gift is showing, process the next one from the queue
      const nextGift = giftQueue[0];
      setCurrentGift({ ...nextGift, combo: 1 });
      setGiftQueue(prev => prev.slice(1));
      setIsVisible(true);
    }
  }, [currentGift, giftQueue]);


  if (!currentGift) {
    return null;
  }

  return (
    <div
      key={currentGift.id} // Use gift id to re-trigger animation on new gift
      className={`fixed left-4 top-48 z-[90] pointer-events-auto flex items-center p-1 bg-gradient-to-r from-purple-900/80 via-black/70 to-black/70 backdrop-blur-md rounded-full shadow-lg border border-purple-500/50 transform transition-all duration-500 ${isVisible ? 'animate-gift-banner-in' : 'animate-gift-banner-out'}`}
    >
      <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden shrink-0 border-2 border-purple-400">
        {currentGift.senderAvatarUrl ? (
          <img src={currentGift.senderAvatarUrl} alt={currentGift.senderName} className="w-full h-full object-cover" />
        ) : (
          <UserPlaceholderIcon className="w-full h-full text-gray-500 p-1" />
        )}
      </div>

      <div className="text-white text-sm text-left mx-3 flex-grow">
        <p className="font-bold">{currentGift.senderName}</p>
        <p className="text-xs text-gray-300">enviou {currentGift.giftName}!</p>
      </div>
      
      <img src={currentGift.imageUrl} alt={currentGift.giftName} className="w-12 h-12 object-contain" />
      
      {currentGift.combo > 1 && (
        <div className="text-3xl font-black italic text-yellow-300 drop-shadow-lg animate-combo-thump ml-2 pr-4" key={currentGift.combo}>
          <span className="text-xl font-semibold not-italic">x</span>{currentGift.combo}
        </div>
      )}
    </div>
  );
};

export default GiftDisplayAnimation;
