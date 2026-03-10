import React from 'react';

/**
 * Frame 1: Blue Crystal
 * Design: Neon blue circular frame with crystalline diamonds
 * Animations: Pulsing crystal glow, rotating diamond sparkles
 * Color Scheme: Electric blue (#4338ca), cyan accents, white highlights
 */
export const FrameBlueCrystal: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <style>{`
        @keyframes crystal-pulse {
          0%, 100% { opacity: 0.6; filter: drop-shadow(0 0 3px rgba(67, 56, 202, 0.5)); }
          50% { opacity: 1; filter: drop-shadow(0 0 8px rgba(67, 56, 202, 0.9)); }
        }
        @keyframes diamond-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes sparkle-twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </defs>
    
    {/* Main circular frame */}
    <circle cx="50" cy="50" r="40" stroke="#4338ca" strokeWidth="3" style={{ animation: 'crystal-pulse 3s infinite' }} />
    <circle cx="50" cy="50" r="38" stroke="#0ea5e9" strokeWidth="1" opacity="0.5" />
    
    {/* Top diamond */}
    <g style={{ animation: 'diamond-rotate 8s infinite', transformOrigin: '50px 50px' }}>
      <polygon points="50,10 55,18 50,26 45,18" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="0.5" />
      <polygon points="50,10 55,18 50,26 45,18" fill="url(#diamondGradient)" opacity="0.6" />
    </g>
    
    {/* Bottom diamond */}
    <polygon points="50,90 55,82 50,74 45,82" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="0.5" style={{ animation: 'sparkle-twinkle 2.5s infinite 0.5s' }} />
    
    {/* Left diamonds */}
    <polygon points="15,50 23,55 15,60 7,55" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="0.5" style={{ animation: 'sparkle-twinkle 3s infinite' }} />
    <polygon points="20,35 25,40 20,45 15,40" fill="#bfdbfe" stroke="#0ea5e9" strokeWidth="0.5" opacity="0.7" style={{ animation: 'sparkle-twinkle 2s infinite 0.3s' }} />
    
    {/* Right diamonds */}
    <polygon points="85,50 93,55 85,60 77,55" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="0.5" style={{ animation: 'sparkle-twinkle 3.5s infinite 0.2s' }} />
    <polygon points="80,65 85,70 80,75 75,70" fill="#bfdbfe" stroke="#0ea5e9" strokeWidth="0.5" opacity="0.7" style={{ animation: 'sparkle-twinkle 2.5s infinite 0.6s' }} />
    
    {/* Decorative stars */}
    <circle cx="30" cy="20" r="1.5" fill="#e0f2fe" style={{ animation: 'sparkle-twinkle 2s infinite' }} />
    <circle cx="70" cy="25" r="1" fill="#bfdbfe" style={{ animation: 'sparkle-twinkle 2.5s infinite 0.4s' }} />
    <circle cx="25" cy="75" r="1.5" fill="#e0f2fe" style={{ animation: 'sparkle-twinkle 3s infinite 0.2s' }} />
    <circle cx="75" cy="80" r="1" fill="#bfdbfe" style={{ animation: 'sparkle-twinkle 2.2s infinite 0.5s' }} />
    
    {/* Gradient definitions */}
    <defs>
      <linearGradient id="diamondGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0ea5e9" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
  </svg>
);

export default FrameBlueCrystal;
