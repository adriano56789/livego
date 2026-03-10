import React from 'react';

/**
 * Frame 4: Ornate Magenta
 * Design: Elaborate ornamental frame with baroque-inspired patterns
 * Animations: Rotating ornaments, pulsing gems, flowing patterns
 * Color Scheme: Magenta (#d946ef), hot pink (#ec4899), gold (#fbbf24), purple (#a855f7)
 */
export const FrameOrnateMagenta: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <style>{`
        @keyframes ornament-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes gem-pulse-strong {
          0%, 100% { opacity: 0.5; filter: drop-shadow(0 0 2px rgba(217, 70, 239, 0.3)); }
          50% { opacity: 1; filter: drop-shadow(0 0 6px rgba(217, 70, 239, 0.9)); }
        }
        @keyframes pattern-flow {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes scroll-pattern {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(2px); }
        }
      `}</style>
    </defs>
    
    {/* Main magenta frame */}
    <circle cx="50" cy="50" r="40" stroke="#d946ef" strokeWidth="2.5" />
    <circle cx="50" cy="50" r="38" stroke="#ec4899" strokeWidth="1" opacity="0.5" />
    
    {/* Ornamental corners - top left */}
    <g style={{ animation: 'ornament-spin 8s infinite', transformOrigin: '30px 30px' }}>
      <path d="M 30 25 Q 25 30 30 35" stroke="#a855f7" strokeWidth="1.5" fill="none" />
      <circle cx="30" cy="25" r="1.5" fill="#fbbf24" />
      <circle cx="30" cy="35" r="1.5" fill="#fbbf24" />
    </g>
    
    {/* Ornamental corners - top right */}
    <g style={{ animation: 'ornament-spin 8s infinite reverse', transformOrigin: '70px 30px' }}>
      <path d="M 70 25 Q 75 30 70 35" stroke="#a855f7" strokeWidth="1.5" fill="none" />
      <circle cx="70" cy="25" r="1.5" fill="#fbbf24" />
      <circle cx="70" cy="35" r="1.5" fill="#fbbf24" />
    </g>
    
    {/* Ornamental corners - bottom left */}
    <g style={{ animation: 'ornament-spin 8s infinite', transformOrigin: '30px 70px' }}>
      <path d="M 30 75 Q 25 70 30 65" stroke="#a855f7" strokeWidth="1.5" fill="none" />
      <circle cx="30" cy="75" r="1.5" fill="#fbbf24" />
      <circle cx="30" cy="65" r="1.5" fill="#fbbf24" />
    </g>
    
    {/* Ornamental corners - bottom right */}
    <g style={{ animation: 'ornament-spin 8s infinite reverse', transformOrigin: '70px 70px' }}>
      <path d="M 70 75 Q 75 70 70 65" stroke="#a855f7" strokeWidth="1.5" fill="none" />
      <circle cx="70" cy="75" r="1.5" fill="#fbbf24" />
      <circle cx="70" cy="65" r="1.5" fill="#fbbf24" />
    </g>
    
    {/* Top center diamond */}
    <polygon points="50,8 55,16 50,24 45,16" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.5" style={{ animation: 'gem-pulse-strong 2.5s infinite' }} />
    
    {/* Bottom center diamond */}
    <polygon points="50,92 55,84 50,76 45,84" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.5" style={{ animation: 'gem-pulse-strong 2.5s infinite 0.5s' }} />
    
    {/* Left center diamond */}
    <polygon points="6,50 14,55 6,60 -2,55" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="0.5" style={{ animation: 'gem-pulse-strong 2.5s infinite 0.3s' }} />
    
    {/* Right center diamond */}
    <polygon points="94,50 102,55 94,60 86,55" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="0.5" style={{ animation: 'gem-pulse-strong 2.5s infinite 0.6s' }} />
    
    {/* Decorative side ornaments */}
    <g style={{ animation: 'scroll-pattern 3s infinite', transformOrigin: '20px 50px' }}>
      <circle cx="20" cy="40" r="1" fill="#fbbf24" opacity="0.8" />
      <circle cx="20" cy="50" r="1" fill="#fbbf24" opacity="0.8" />
      <circle cx="20" cy="60" r="1" fill="#fbbf24" opacity="0.8" />
    </g>
    
    <g style={{ animation: 'scroll-pattern 3s infinite reverse', transformOrigin: '80px 50px' }}>
      <circle cx="80" cy="40" r="1" fill="#fbbf24" opacity="0.8" />
      <circle cx="80" cy="50" r="1" fill="#fbbf24" opacity="0.8" />
      <circle cx="80" cy="60" r="1" fill="#fbbf24" opacity="0.8" />
    </g>
    
    {/* Inner decorative circles */}
    <circle cx="50" cy="50" r="32" stroke="#d946ef" strokeWidth="0.5" opacity="0.3" />
    <circle cx="50" cy="50" r="28" stroke="#ec4899" strokeWidth="0.5" opacity="0.3" />
    
    {/* Small accent gems */}
    <circle cx="35" cy="25" r="0.8" fill="#fbbf24" style={{ animation: 'gem-pulse-strong 2s infinite 0.2s' }} />
    <circle cx="65" cy="25" r="0.8" fill="#fbbf24" style={{ animation: 'gem-pulse-strong 2s infinite 0.4s' }} />
    <circle cx="35" cy="75" r="0.8" fill="#fbbf24" style={{ animation: 'gem-pulse-strong 2s infinite 0.6s' }} />
    <circle cx="65" cy="75" r="0.8" fill="#fbbf24" style={{ animation: 'gem-pulse-strong 2s infinite 0.8s' }} />
  </svg>
);

export default FrameOrnateMagenta;
