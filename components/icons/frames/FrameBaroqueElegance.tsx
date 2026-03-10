import React from 'react';

/**
 * Frame 6: Baroque Elegance
 * Design: Luxurious baroque-inspired frame with ornate scrollwork
 * Animations: Rotating ornaments, pulsing gems, flowing decorative patterns
 * Color Scheme: Deep purple (#7c3aed), magenta (#d946ef), gold (#fbbf24), silver (#e5e7eb)
 */
export const FrameBaroqueElegance: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <style>{`
        @keyframes baroque-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes gold-pulse {
          0%, 100% { opacity: 0.6; filter: drop-shadow(0 0 2px rgba(251, 191, 36, 0.3)); }
          50% { opacity: 1; filter: drop-shadow(0 0 5px rgba(251, 191, 36, 0.8)); }
        }
        @keyframes scroll-wave {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(2px); }
        }
        @keyframes gem-twinkle {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </defs>
    
    {/* Main purple frame */}
    <circle cx="50" cy="50" r="40" stroke="#7c3aed" strokeWidth="2.5" />
    <circle cx="50" cy="50" r="38" stroke="#d946ef" strokeWidth="1" opacity="0.6" />
    
    {/* Ornate scrollwork - top left */}
    <g style={{ animation: 'baroque-spin 10s infinite', transformOrigin: '28px 28px' }}>
      <path d="M 28 22 Q 25 25 28 28 Q 31 25 28 22" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
      <circle cx="28" cy="22" r="1" fill="#fbbf24" />
      <circle cx="28" cy="28" r="1" fill="#fbbf24" />
    </g>
    
    {/* Ornate scrollwork - top right */}
    <g style={{ animation: 'baroque-spin 10s infinite reverse', transformOrigin: '72px 28px' }}>
      <path d="M 72 22 Q 75 25 72 28 Q 69 25 72 22" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
      <circle cx="72" cy="22" r="1" fill="#fbbf24" />
      <circle cx="72" cy="28" r="1" fill="#fbbf24" />
    </g>
    
    {/* Ornate scrollwork - bottom left */}
    <g style={{ animation: 'baroque-spin 10s infinite', transformOrigin: '28px 72px' }}>
      <path d="M 28 78 Q 25 75 28 72 Q 31 75 28 78" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
      <circle cx="28" cy="78" r="1" fill="#fbbf24" />
      <circle cx="28" cy="72" r="1" fill="#fbbf24" />
    </g>
    
    {/* Ornate scrollwork - bottom right */}
    <g style={{ animation: 'baroque-spin 10s infinite reverse', transformOrigin: '72px 72px' }}>
      <path d="M 72 78 Q 75 75 72 72 Q 69 75 72 78" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
      <circle cx="72" cy="78" r="1" fill="#fbbf24" />
      <circle cx="72" cy="72" r="1" fill="#fbbf24" />
    </g>
    
    {/* Top center ornament */}
    <g style={{ animation: 'gold-pulse 2.5s infinite', transformOrigin: '50px 10px' }}>
      <polygon points="50,8 54,14 50,20 46,14" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.5" />
      <circle cx="50" cy="8" r="1.5" fill="#fbbf24" />
    </g>
    
    {/* Bottom center ornament */}
    <g style={{ animation: 'gold-pulse 2.5s infinite 0.5s', transformOrigin: '50px 90px' }}>
      <polygon points="50,92 54,86 50,80 46,86" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.5" />
      <circle cx="50" cy="92" r="1.5" fill="#fbbf24" />
    </g>
    
    {/* Left center ornament */}
    <g style={{ animation: 'gold-pulse 2.5s infinite 0.3s', transformOrigin: '8px 50px' }}>
      <polygon points="6,50 12,55 6,60 0,55" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="0.5" />
    </g>
    
    {/* Right center ornament */}
    <g style={{ animation: 'gold-pulse 2.5s infinite 0.6s', transformOrigin: '92px 50px' }}>
      <polygon points="94,50 100,55 94,60 88,55" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="0.5" />
    </g>
    
    {/* Decorative side scrolls */}
    <g style={{ animation: 'scroll-wave 3s infinite', transformOrigin: '15px 50px' }}>
      <path d="M 12 40 Q 15 45 12 50 Q 15 55 12 60" stroke="#fbbf24" strokeWidth="1" fill="none" opacity="0.7" />
    </g>
    
    <g style={{ animation: 'scroll-wave 3s infinite reverse', transformOrigin: '85px 50px' }}>
      <path d="M 88 40 Q 85 45 88 50 Q 85 55 88 60" stroke="#fbbf24" strokeWidth="1" fill="none" opacity="0.7" />
    </g>
    
    {/* Inner decorative circles */}
    <circle cx="50" cy="50" r="32" stroke="#7c3aed" strokeWidth="0.5" opacity="0.3" />
    <circle cx="50" cy="50" r="28" stroke="#d946ef" strokeWidth="0.5" opacity="0.3" />
    
    {/* Accent gems */}
    <circle cx="35" cy="25" r="1" fill="#fbbf24" style={{ animation: 'gem-twinkle 2s infinite 0.2s' }} />
    <circle cx="65" cy="25" r="1" fill="#fbbf24" style={{ animation: 'gem-twinkle 2s infinite 0.4s' }} />
    <circle cx="35" cy="75" r="1" fill="#fbbf24" style={{ animation: 'gem-twinkle 2s infinite 0.6s' }} />
    <circle cx="65" cy="75" r="1" fill="#fbbf24" style={{ animation: 'gem-twinkle 2s infinite 0.8s' }} />
    
    {/* Small silver accents */}
    <circle cx="25" cy="50" r="0.8" fill="#e5e7eb" style={{ animation: 'gem-twinkle 1.5s infinite 0.3s' }} />
    <circle cx="75" cy="50" r="0.8" fill="#e5e7eb" style={{ animation: 'gem-twinkle 1.5s infinite 0.7s' }} />
  </svg>
);

export default FrameBaroqueElegance;
