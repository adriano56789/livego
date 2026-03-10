import React from 'react';

/**
 * Frame 7: Mystical Wings
 * Design: Ethereal frame with flowing wing-like elements
 * Animations: Fluttering wings, pulsing mystical aura, floating effects
 * Color Scheme: Deep purple (#6d28d9), cyan (#06b6d4), magenta (#d946ef), white (#f5f5f4)
 */
export const FrameMysticalWings: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <style>{`
        @keyframes wing-flutter {
          0%, 100% { transform: scaleX(1) scaleY(1); opacity: 0.7; }
          25% { transform: scaleX(0.9) scaleY(1.1); opacity: 0.8; }
          50% { transform: scaleX(1) scaleY(1); opacity: 1; }
          75% { transform: scaleX(0.9) scaleY(1.1); opacity: 0.8; }
        }
        @keyframes wing-flutter-reverse {
          0%, 100% { transform: scaleX(-1) scaleY(1); opacity: 0.7; }
          25% { transform: scaleX(-0.9) scaleY(1.1); opacity: 0.8; }
          50% { transform: scaleX(-1) scaleY(1); opacity: 1; }
          75% { transform: scaleX(-0.9) scaleY(1.1); opacity: 0.8; }
        }
        @keyframes mystical-aura {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(109, 40, 217, 0.3)); }
          50% { filter: drop-shadow(0 0 8px rgba(109, 40, 217, 0.8)); }
        }
        @keyframes float-gently {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        @keyframes gem-shimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </defs>
    
    {/* Main mystical frame */}
    <circle cx="50" cy="50" r="40" stroke="#6d28d9" strokeWidth="2.5" style={{ animation: 'mystical-aura 3s infinite' }} />
    <circle cx="50" cy="50" r="38" stroke="#06b6d4" strokeWidth="1" opacity="0.5" />
    
    {/* Top left wing */}
    <g style={{ animation: 'wing-flutter 2s infinite', transformOrigin: '30px 25px' }}>
      <path d="M 30 20 Q 25 22 22 28 Q 25 25 30 20" fill="#d946ef" opacity="0.8" />
      <path d="M 30 20 Q 28 22 26 26" stroke="#06b6d4" strokeWidth="0.5" fill="none" />
    </g>
    
    {/* Top right wing */}
    <g style={{ animation: 'wing-flutter-reverse 2s infinite', transformOrigin: '70px 25px' }}>
      <path d="M 70 20 Q 75 22 78 28 Q 75 25 70 20" fill="#d946ef" opacity="0.8" />
      <path d="M 70 20 Q 72 22 74 26" stroke="#06b6d4" strokeWidth="0.5" fill="none" />
    </g>
    
    {/* Bottom left wing */}
    <g style={{ animation: 'wing-flutter-reverse 2.5s infinite 0.5s', transformOrigin: '30px 75px' }}>
      <path d="M 30 80 Q 25 78 22 72 Q 25 75 30 80" fill="#d946ef" opacity="0.8" />
      <path d="M 30 80 Q 28 78 26 74" stroke="#06b6d4" strokeWidth="0.5" fill="none" />
    </g>
    
    {/* Bottom right wing */}
    <g style={{ animation: 'wing-flutter 2.5s infinite 0.5s', transformOrigin: '70px 75px' }}>
      <path d="M 70 80 Q 75 78 78 72 Q 75 75 70 80" fill="#d946ef" opacity="0.8" />
      <path d="M 70 80 Q 72 78 74 74" stroke="#06b6d4" strokeWidth="0.5" fill="none" />
    </g>
    
    {/* Top center diamond */}
    <polygon points="50,8 54,16 50,24 46,16" fill="#f5f5f4" stroke="#06b6d4" strokeWidth="0.5" style={{ animation: 'gem-shimmer 2.5s infinite' }} />
    
    {/* Bottom center diamond */}
    <polygon points="50,92 54,84 50,76 46,84" fill="#f5f5f4" stroke="#06b6d4" strokeWidth="0.5" style={{ animation: 'gem-shimmer 2.5s infinite 0.5s' }} />
    
    {/* Left center diamond */}
    <polygon points="6,50 14,55 6,60 -2,55" fill="#d946ef" stroke="#a855f7" strokeWidth="0.5" style={{ animation: 'gem-shimmer 2.5s infinite 0.3s' }} />
    
    {/* Right center diamond */}
    <polygon points="94,50 102,55 94,60 86,55" fill="#d946ef" stroke="#a855f7" strokeWidth="0.5" style={{ animation: 'gem-shimmer 2.5s infinite 0.6s' }} />
    
    {/* Floating mystical orbs */}
    <circle cx="20" cy="35" r="1.5" fill="#06b6d4" style={{ animation: 'float-gently 3s infinite 0.2s' }} />
    <circle cx="80" cy="35" r="1.5" fill="#06b6d4" style={{ animation: 'float-gently 3s infinite 0.5s' }} />
    <circle cx="20" cy="65" r="1.5" fill="#d946ef" style={{ animation: 'float-gently 3s infinite 0.7s' }} />
    <circle cx="80" cy="65" r="1.5" fill="#d946ef" style={{ animation: 'float-gently 3s infinite 1s' }} />
    
    {/* Inner mystical circles */}
    <circle cx="50" cy="50" r="32" stroke="#6d28d9" strokeWidth="0.5" opacity="0.3" />
    <circle cx="50" cy="50" r="28" stroke="#06b6d4" strokeWidth="0.5" opacity="0.3" />
    
    {/* Decorative mystical lines */}
    <path d="M 35 35 L 65 65" stroke="#d946ef" strokeWidth="0.5" opacity="0.4" />
    <path d="M 65 35 L 35 65" stroke="#06b6d4" strokeWidth="0.5" opacity="0.4" />
    
    {/* Small accent stars */}
    <circle cx="40" cy="20" r="0.7" fill="#f5f5f4" style={{ animation: 'gem-shimmer 1.5s infinite 0.3s' }} />
    <circle cx="60" cy="20" r="0.7" fill="#f5f5f4" style={{ animation: 'gem-shimmer 1.5s infinite 0.5s' }} />
    <circle cx="40" cy="80" r="0.7" fill="#f5f5f4" style={{ animation: 'gem-shimmer 1.5s infinite 0.7s' }} />
    <circle cx="60" cy="80" r="0.7" fill="#f5f5f4" style={{ animation: 'gem-shimmer 1.5s infinite 0.9s' }} />
  </svg>
);

export default FrameMysticalWings;
