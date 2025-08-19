
import React, { useEffect } from 'react';

interface PkClashAnimationProps {
  onAnimationEnd: () => void;
}

const PkClashAnimation: React.FC<PkClashAnimationProps> = ({ onAnimationEnd }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onAnimationEnd();
    }, 2500); // Animation duration is 2.5s

    return () => clearTimeout(timer);
  }, [onAnimationEnd]);
  
  const leftEmoji = '😠';
  const rightEmoji = '😤';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 pointer-events-none overflow-hidden" style={{ animation: 'clash-container-fade 2.5s ease-in-out forwards' }}>
      
      {/* Auras */}
      <div className="absolute w-full h-full bg-gradient-to-r from-pink-500/50 via-transparent to-transparent" style={{ animation: 'aura-left 0.5s ease-out forwards' }} />
      <div className="absolute w-full h-full bg-gradient-to-l from-cyan-400/50 via-transparent to-transparent" style={{ animation: 'aura-right 0.5s ease-out forwards' }} />

      <div className="relative w-full max-w-sm h-48 flex items-center justify-center">
        
        {/* Left Side */}
        <div className="absolute" style={{ animation: 'clash-left 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>
          <div className="relative">
            <span className="text-8xl drop-shadow-[0_0_15px_rgba(236,72,153,0.8)]">{leftEmoji}</span>
            <span className="absolute -bottom-4 right-0 text-6xl transform rotate-[15deg]">🥊</span>
          </div>
        </div>

        {/* Right Side */}
        <div className="absolute" style={{ animation: 'clash-right 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>
          <div className="relative">
            <span className="text-8xl drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">{rightEmoji}</span>
            <span className="absolute -bottom-4 left-0 text-6xl transform -rotate-[15deg] scale-x-[-1]">🥊</span>
          </div>
        </div>

        {/* Impact Flash */}
        <div className="absolute w-1 h-1 bg-white rounded-full" style={{ animation: 'impact-flash 1.5s ease-out 0.5s forwards' }} />

        {/* Particles flying out */}
        {Array.from({ length: 30 }).map((_, i) => {
          const angle = Math.random() * 360;
          const distance = Math.random() * 150 + 50;
          const duration = Math.random() * 0.5 + 0.5;
          const delay = 0.8; // Start after impact
          const size = Math.random() * 4 + 2;
          const color = ['#f472b6', '#a78bfa', '#60a5fa', '#34d399', '#fde047'][i % 5];
          
          return (
            <div
              key={i}
              className="absolute rounded-full animate-particle-burst"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                '--angle': `${angle}deg`,
                '--distance': `${distance}px`,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
              } as React.CSSProperties}
            />
          );
        })}

      </div>
    </div>
  );
};

export default PkClashAnimation;
