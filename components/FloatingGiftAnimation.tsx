
import React, { useState, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { Player } from '@lottiefiles/react-lottie-player';

interface FloatingGift {
  id: string;
  animationUrl: string;
  sender: string;
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
      const newGift: FloatingGift = {
        id: `${lastGift.id}-${Date.now()}`,
        animationUrl: lastGift.giftAnimationUrl,
        sender: lastGift.username,
        giftName: lastGift.giftName || 'um presente',
        x: Math.random() * 60 + 20, // Random horizontal position between 20% and 80%
      };
      
      setGifts(prev => [...prev, newGift]);

      // Clean up the gift after the animation is done
      setTimeout(() => {
        setGifts(prev => prev.filter(g => g.id !== newGift.id));
      }, 5000); // Corresponds to animation duration in index.html
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
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-3 py-1.5 rounded-full text-sm shadow-lg">
                <span className="font-bold">{gift.sender}</span> enviou um {gift.giftName}!
            </div>
             <Player
                src={gift.animationUrl}
                className="w-20 h-20"
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
