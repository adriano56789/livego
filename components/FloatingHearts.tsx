import React, { useState, useImperativeHandle, forwardRef } from 'react';
import HeartSolidIcon from './icons/HeartSolidIcon';

interface Heart {
  id: number;
  style: React.CSSProperties;
}

export interface FloatingHeartsRef {
  addHeart: () => void;
}

const FloatingHearts = forwardRef<FloatingHeartsRef, {}>((props, ref) => {
  const [hearts, setHearts] = useState<Heart[]>([]);

  useImperativeHandle(ref, () => ({
    addHeart: () => {
      const id = Date.now() + Math.random();
      const style: React.CSSProperties = {
        left: `${Math.random() * 40 - 20}px`, // Posição horizontal aleatória de -20px a +20px
        animationDuration: `${Math.random() * 1 + 2}s`, // Duração aleatória entre 2s e 3s
        animationDelay: `${Math.random() * 0.2}s`,
      };
      
      setHearts(prev => [...prev, { id, style }]);

      // Remove o coração após a animação terminar
      setTimeout(() => {
        setHearts(prev => prev.filter(h => h.id !== id));
      }, 3000); // Um pouco mais longo que a duração máxima da animação
    },
  }));

  return (
    <div className="absolute bottom-20 right-5 pointer-events-none">
      {hearts.map(heart => (
        <div key={heart.id} className="absolute bottom-0 animate-float-up-and-away" style={heart.style}>
          <HeartSolidIcon className="w-8 h-8 text-red-500" style={{ filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.5))' }}/>
        </div>
      ))}
    </div>
  );
});

export default FloatingHearts;
