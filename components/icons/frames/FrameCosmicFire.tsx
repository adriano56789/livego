import React from 'react';

/**
 * Frame 8: Cosmic Fire
 * Design: Intense frame with cosmic flame-like elements
 * Animations: Flickering flames, pulsing cosmic energy, rotating fire patterns
 * Color Scheme: Orange (#f97316), red (#dc2626), blue (#3b82f6), cyan (#06b6d4)
 */
export const FrameCosmicFire: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <style>{`
        @keyframes flame-flicker {
          0%, 100% { transform: scaleY(1); opacity: 0.8; }
          25% { transform: scaleY(1.2); opacity: 0.9; }
          50% { transform: scaleY(0.9); opacity: 1; }
          75% { transform: scaleY(1.1); opacity: 0.85; }
        }
        @keyframes flame-flicker-reverse {
          0%, 100% { transform: scaleY(1); opacity: 0.8; }
          25% { transform: scaleY(1.1); opacity: 0.9; }
          50% { transform: scaleY(0.9); opacity: 1; }
          75% { transform: scaleY(1.2); opacity: 0.85; }
        }
        @keyframes cosmic-pulse {
          0%, 100% { filter: drop-shadow(0 0 3px rgba(249, 115, 22, 0.4)); }
          50% { filter: drop-shadow(0 0 10px rgba(249, 115, 22, 0.9)); }
        }
        @keyframes rotate-fire {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes energy-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </defs>
    
    {/* Main cosmic frame */}
    <circle cx="50" cy="50" r="40" stroke="#f97316" strokeWidth="2.5" style={{ animation: 'cosmic-pulse 3s infinite' }} />
    <circle cx="50" cy="50" r="38" stroke="#dc2626" strokeWidth="1" opacity="0.6" />
    
    {/* Top left flame */}
    <g style={{ animation: 'flame-flicker 1.5s infinite', transformOrigin: '25px 15px' }}>
      <path d="M 25 10 Q 22 15 25 22 Q 28 15 25 10" fill="#f97316" />
      <path d="M 25 12 Q 23 16 25 20" stroke="#fbbf24" strokeWidth="0.5" fill="none" />
    </g>
    
    {/* Top right flame */}
    <g style={{ animation: 'flame-flicker-reverse 1.8s infinite 0.3s', transformOrigin: '75px 15px' }}>
      <path d="M 75 10 Q 78 15 75 22 Q 72 15 75 10" fill="#f97316" />
      <path d="M 75 12 Q 77 16 75 20" stroke="#fbbf24" strokeWidth="0.5" fill="none" />
    </g>
    
    {/* Bottom left flame */}
    <g style={{ animation: 'flame-flicker-reverse 1.6s infinite 0.5s', transformOrigin: '25px 85px' }}>
      <path d="M 25 90 Q 22 85 25 78 Q 28 85 25 90" fill="#dc2626" />
      <path d="M 25 88 Q 23 84 25 80" stroke="#fbbf24" strokeWidth="0.5" fill="none" />
    </g>
    
    {/* Bottom right flame */}
    <g style={{ animation: 'flame-flicker 1.7s infinite 0.2s', transformOrigin: '75px 85px' }}>
      <path d="M 75 90 Q 78 85 75 78 Q 72 85 75 90" fill="#dc2626" />
      <path d="M 75 88 Q 77 84 75 80" stroke="#fbbf24" strokeWidth="0.5" fill="none" />
    </g>
    
    {/* Top center diamond */}
    <polygon points="50,8 54,16 50,24 46,16" fill="#06b6d4" stroke="#0ea5e9" strokeWidth="0.5" style={{ animation: 'energy-pulse 2.5s infinite' }} />
    
    {/* Bottom center diamond */}
    <polygon points="50,92 54,84 50,76 46,84" fill="#06b6d4" stroke="#0ea5e9" strokeWidth="0.5" style={{ animation: 'energy-pulse 2.5s infinite 0.5s' }} />
    
    {/* Left center diamond */}
    <polygon points="6,50 14,55 6,60 -2,55" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.5" style={{ animation: 'energy-pulse 2.5s infinite 0.3s' }} />
    
    {/* Right center diamond */}
    <polygon points="94,50 102,55 94,60 86,55" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.5" style={{ animation: 'energy-pulse 2.5s infinite 0.6s' }} />
    
    {/* Rotating fire ornaments */}
    <g style={{ animation: 'rotate-fire 8s infinite', transformOrigin: '50px 50px' }}>
      <circle cx="35" cy="25" r="1.2" fill="#f97316" opacity="0.8" />
      <circle cx="65" cy="25" r="1.2" fill="#f97316" opacity="0.8" />
      <circle cx="35" cy="75" r="1.2" fill="#dc2626" opacity="0.8" />
      <circle cx="65" cy="75" r="1.2" fill="#dc2626" opacity="0.8" />
    </g>
    
    {/* Cosmic energy spheres */}
    <circle cx="15" cy="40" r="1.5" fill="#06b6d4" style={{ animation: 'energy-pulse 2s infinite 0.2s' }} />
    <circle cx="85" cy="40" r="1.5" fill="#06b6d4" style={{ animation: 'energy-pulse 2s infinite 0.4s' }} />
    <circle cx="15" cy="60" r="1.5" fill="#3b82f6" style={{ animation: 'energy-pulse 2s infinite 0.6s' }} />
    <circle cx="85" cy="60" r="1.5" fill="#3b82f6" style={{ animation: 'energy-pulse 2s infinite 0.8s' }} />
    
    {/* Inner decorative circles */}
    <circle cx="50" cy="50" r="32" stroke="#f97316" strokeWidth="0.5" opacity="0.3" />
    <circle cx="50" cy="50" r="28" stroke="#dc2626" strokeWidth="0.5" opacity="0.3" />
    
    {/* Flame accent lines */}
    <path d="M 30 30 L 50 50 L 30 70" stroke="#f97316" strokeWidth="0.5" opacity="0.4" />
    <path d="M 70 30 L 50 50 L 70 70" stroke="#dc2626" strokeWidth="0.5" opacity="0.4" />
  </svg>
);

export default FrameCosmicFire;
