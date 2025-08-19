
import React, { useState, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { Player } from '@lottiefiles/react-lottie-player';
import * as authService from '../services/authService';

interface FloatingGift {
  id: string;
  animationUrl: string;
  sender: string;
  senderAvatarUrl: string;
  giftName: string;
  x: number; // horizontal position percentage
}

interface FloatingGiftAnimationProps {
  lastGift: ChatMessage | null;
}

const FloatingGiftAnimation: React.FC<FloatingGiftAnimationProps> = ({ lastGift }) => {
  const [gifts, setGifts] = useState<FloatingGift[]>([]);

  useEffect(() => {
    if (lastGift && lastGift.giftAnimationUrl) {
      const createGift = async () => {
        let senderAvatar = '';
        try {
            const senderProfile = await authService.getUserProfile(lastGift.userId);
            senderAvatar = senderProfile.avatar_url || '';
        } catch (e) {
            console.error("Could not fetch sender profile for gift animation", e);
        }
        
        const newGift: FloatingGift = {
          id: `${lastGift.id}-${Date.now()}`,
          animationUrl: lastGift.giftAnimationUrl,
          sender: lastGift.username,
          senderAvatarUrl: senderAvatar,
          giftName: lastGift.giftName || 'um presente',
          x: Math.random() * 60 + 20, // Random horizontal position between 20% and 80%
        };
        
        setGifts(prev => [...prev, newGift]);
  
        // Clean up the gift after the animation is done
        setTimeout(() => {
          setGifts(prev => prev.filter(g => g.id !== newGift.id));
        }, 5000); // Corresponds to animation duration in index.html
      };
      createGift();
    }
  }, [lastGift]);

  return (
    <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
      {gifts.map(gift => (
        <div
          key={gift.id}
          className="absolute bottom-20 animate-float-up"
          style={{ left: `${gift.x}%`, transform: 'translateX(-50%)' }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="bg-black/60 backdrop-blur-sm p-1 pr-3 rounded-full flex items-center gap-2 shadow-lg">
                {gift.senderAvatarUrl ? (
                    <img src={gift.senderAvatarUrl} alt={gift.sender} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-700"></div>
                )}
                <div className="text-white text-sm">
                    <p className="font-bold">{gift.sender}</p>
                    <p className="text-xs text-gray-300">enviou {gift.giftName}</p>
                </div>
            </div>
             <Player
                src={gift.animationUrl}
                className="w-24 h-24 -mt-4"
                autoplay
                loop
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default FloatingGiftAnimation;