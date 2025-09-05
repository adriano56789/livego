
import React, { useState, useEffect } from 'react';
import type { ChatMessage } from '../types';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';

interface GiftQueueItem {
  id: number;
  avatarUrl: string;
  username: string;
  giftName?: string;
  giftImageUrl?: string;
  recipientName?: string;
}

interface FloatingGiftAvatarsProps {
  triggeredGift: ChatMessage | null;
}

const FloatingGiftAvatars: React.FC<FloatingGiftAvatarsProps> = ({ triggeredGift }) => {
  const [giftQueue, setGiftQueue] = useState<GiftQueueItem[]>([]);
  const [visibleAvatars, setVisibleAvatars] = useState<(GiftQueueItem & { key: number })[]>([]);
  const MAX_VISIBLE = 5;

  useEffect(() => {
    if (triggeredGift && triggeredGift.type === 'gift') {
      const newGift: GiftQueueItem = {
        id: triggeredGift.id,
        avatarUrl: triggeredGift.avatarUrl || '',
        username: triggeredGift.username,
        giftName: triggeredGift.giftName,
        giftImageUrl: triggeredGift.giftImageUrl,
        recipientName: triggeredGift.recipientName,
      };
      setGiftQueue(prev => [...prev, newGift]);
    }
  }, [triggeredGift]);

  useEffect(() => {
    if (giftQueue.length > 0 && visibleAvatars.length < MAX_VISIBLE) {
      const nextInQueue = giftQueue[0];
      setGiftQueue(q => q.slice(1));
      
      const newItem = { ...nextInQueue, key: nextInQueue.id + Math.random() };
      setVisibleAvatars(v => [...v, newItem]);

      // The animation itself is 4 seconds long and handles fade-out.
      // This timeout removes the element from the DOM after the animation completes.
      setTimeout(() => {
        setVisibleAvatars(v => v.filter(item => item.key !== newItem.key));
      }, 4000);
    }
  }, [giftQueue, visibleAvatars.length]);

  return (
    <div className="fixed top-1/2 left-0 right-0 pointer-events-none flex flex-col items-center gap-4 z-[100]">
      {visibleAvatars.map((gift) => (
        <div
          key={gift.key}
          className="animate-float-up bg-black/70 backdrop-blur-md rounded-full p-2 flex items-center gap-3 shadow-lg pointer-events-auto"
        >
          {/* Sender Avatar */}
          <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden shrink-0">
            {gift.avatarUrl ? (
              <img src={gift.avatarUrl} alt={gift.username} className="w-full h-full object-cover" />
            ) : (
              <UserPlaceholderIcon className="w-full h-full text-gray-500 p-1" />
            )}
          </div>
  
          {/* Text */}
          <div className="text-left">
            <p className="text-white font-bold text-sm truncate max-w-[120px]">{gift.username}</p>
            <p className="text-gray-200 text-xs truncate max-w-[120px]">
              enviou {gift.giftName}!
            </p>
          </div>
          
          {/* Gift Icon */}
          {gift.giftImageUrl && (
            <img src={gift.giftImageUrl} alt={gift.giftName} className="w-16 h-16 object-contain -mr-2" />
          )}
        </div>
      ))}
    </div>
  );
};

export default FloatingGiftAvatars;