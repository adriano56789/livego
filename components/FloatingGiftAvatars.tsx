

import React, { useState, useEffect } from 'react';
import type { ChatMessage } from '../types';
import * as authService from '../services/authService';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';

interface GiftQueueItem {
  id: number;
  avatarUrl: string;
  username: string;
  giftName?: string;
  giftImageUrl?: string;
}

interface FloatingGiftAvatarsProps {
  triggeredGift: ChatMessage | null;
  onVisibilityChange: (isVisible: boolean) => void;
}

const FloatingGiftAvatars: React.FC<FloatingGiftAvatarsProps> = ({ triggeredGift, onVisibilityChange }) => {
  const [giftQueue, setGiftQueue] = useState<GiftQueueItem[]>([]);
  const [visibleAvatars, setVisibleAvatars] = useState<(GiftQueueItem & { key: number })[]>([]);
  const MAX_VISIBLE = 5;

  useEffect(() => {
    onVisibilityChange(visibleAvatars.length > 0);
  }, [visibleAvatars.length, onVisibilityChange]);

  useEffect(() => {
    if (triggeredGift && triggeredGift.type === 'gift') {
      const fetchAvatarAndAddToQueue = async () => {
        const newGift: GiftQueueItem = {
          id: triggeredGift.id,
          avatarUrl: triggeredGift.avatarUrl || '',
          username: triggeredGift.username,
          giftName: triggeredGift.giftName,
          giftImageUrl: triggeredGift.giftImageUrl,
        };
        setGiftQueue(prev => [...prev, newGift]);
      };
      fetchAvatarAndAddToQueue();
    }
  }, [triggeredGift]);

  useEffect(() => {
    if (giftQueue.length > 0 && visibleAvatars.length < MAX_VISIBLE) {
      const nextInQueue = giftQueue[0];
      setGiftQueue(q => q.slice(1));
      
      const newItem = { ...nextInQueue, key: nextInQueue.id + Math.random() };
      setVisibleAvatars(v => [...v, newItem]);

      setTimeout(() => {
        setVisibleAvatars(v => v.filter(item => item.key !== newItem.key));
      }, 4000);
    }
  }, [giftQueue, visibleAvatars.length]);

  return (
    <div className="absolute bottom-16 left-2 pointer-events-auto flex flex-col-reverse gap-1 z-20">
      {visibleAvatars.map((gift) => (
        <div
          key={gift.key}
          className="animate-float-up bg-black/60 backdrop-blur-md rounded-full p-0.5 pr-2 flex items-center gap-1.5 shadow-lg"
        >
          <div className="w-7 h-7 rounded-full bg-gray-700 overflow-hidden shrink-0">
            {gift.avatarUrl ? (
              <img src={gift.avatarUrl} alt={gift.username} className="w-full h-full object-cover" />
            ) : (
              <UserPlaceholderIcon className="w-full h-full text-gray-500 p-1" />
            )}
          </div>
          <div>
            <p className="text-white text-[11px] font-bold truncate max-w-[100px]">{gift.username}</p>
            <p className="text-gray-300 text-[9px]">enviou {gift.giftName}</p>
          </div>
          {gift.giftImageUrl && (
            <img src={gift.giftImageUrl} alt={gift.giftName} className="w-7 h-7 object-contain" />
          )}
        </div>
      ))}
    </div>
  );
};

export default FloatingGiftAvatars;