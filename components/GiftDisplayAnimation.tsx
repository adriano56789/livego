import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { Player } from '@lottiefiles/react-lottie-player';
import * as authService from '../services/authService';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';

interface GiftQueueItem {
  id: number; // message id
  giftId: number;
  animationUrl: string;
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
  const [comboKey, setComboKey] = useState(0); // To re-trigger CSS animation

  useEffect(() => {
    if (!triggeredGift?.giftAnimationUrl || !triggeredGift.giftId || !triggeredGift.recipientName) {
      return;
    }

    const processGift = async () => {
      let avatarUrl = '';
      try {
        const profile = await authService.getUserProfile(triggeredGift.userId);
        avatarUrl = profile.avatar_url || '';
      } catch (e) {
        console.error("Failed to fetch sender avatar for gift display:", e);
      }

      const newGift: GiftQueueItem = {
        id: triggeredGift.id,
        giftId: triggeredGift.giftId,
        animationUrl: triggeredGift.giftAnimationUrl,
        senderName: triggeredGift.username,
        senderAvatarUrl: avatarUrl,
        giftName: triggeredGift.giftName || 'um presente',
        recipientName: triggeredGift.recipientName,
      };
      
      setCurrentGift(prevCurrentGift => {
        if (
          prevCurrentGift &&
          isVisible &&
          prevCurrentGift.giftId === newGift.giftId &&
          prevCurrentGift.senderName === newGift.senderName &&
          prevCurrentGift.recipientName === newGift.recipientName
        ) {
          setComboKey(k => k + 1);
          return { ...prevCurrentGift, id: newGift.id, combo: prevCurrentGift.combo + 1 };
        } else {
          setGiftQueue(q => [...q, newGift]);
          return prevCurrentGift;
        }
      });
    };

    processGift();
  }, [triggeredGift]);

  useEffect(() => {
    if (currentGift) {
      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);

      comboTimeoutRef.current = window.setTimeout(() => {
        setIsVisible(false);
      }, 3000); 

      const cleanupTimer = setTimeout(() => {
        setCurrentGift(null);
        comboTimeoutRef.current = null;
      }, 3500);

      return () => {
        clearTimeout(cleanupTimer);
        if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
      };

    } else if (giftQueue.length > 0) {
      const nextGift = giftQueue[0];
      setCurrentGift({ ...nextGift, combo: 1 });
      setGiftQueue(q => q.slice(1));
      setIsVisible(true);
      setComboKey(k => k + 1);
    }
  }, [currentGift, giftQueue]);


  if (!currentGift) {
    return null;
  }

  return (
    <div
      className={`fixed top-1/2 left-1/2 z-[90] pointer-events-none flex flex-col items-center ${isVisible ? 'animate-gift-display-in' : 'animate-gift-display-out'}`}
    >
      <Player
        src={currentGift.animationUrl}
        className="w-64 h-64"
        autoplay
        keepLastFrame
      />
      <div className="bg-black/60 backdrop-blur-md p-1.5 pr-4 rounded-full flex items-center gap-2 shadow-lg -mt-12 max-w-xs">
        <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden shrink-0 border-2 border-purple-400">
        {currentGift.senderAvatarUrl ? (
            <img src={currentGift.senderAvatarUrl} alt={currentGift.senderName} className="w-full h-full object-cover" />
        ) : (
            <UserPlaceholderIcon className="w-full h-full text-gray-500 p-1" />
        )}
        </div>
        <div className="text-white text-sm text-left overflow-hidden">
          <p className="font-bold truncate">{currentGift.senderName}</p>
          <p className="text-xs text-gray-300 truncate">enviou {currentGift.giftName}!</p>
        </div>
        {currentGift.combo > 1 && (
        <div className="text-3xl font-black italic text-yellow-300 drop-shadow-lg animate-combo-thump ml-2" key={comboKey}>
            <span className="text-xl font-semibold not-italic">x</span>{currentGift.combo}
        </div>
        )}
      </div>
    </div>
  );
};

export default GiftDisplayAnimation;
