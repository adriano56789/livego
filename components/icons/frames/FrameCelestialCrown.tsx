import React from 'react';

/**
 * Frame 9: Celestial Crown
 * Design: Majestic frame with crown-like spikes and celestial elements
 * Animations: Rotating crown spikes, twinkling stars, pulsing celestial glow
 * Color Scheme: Orange (#f97316), copper (#b45309), gold (#fbbf24), white (#f5f5f4)
 */
export const FrameCelestialCrown: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <style>{`
        @keyframes crown-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spike-pulse {
          0%, 100% { transform: scaleY(1); opacity: 0.7; }
          50% { transform: scaleY(1.3); opacity: 1; }
        }
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes celestial-glow {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(249, 115, 22, 0.3)); }
          50% { filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.8)); }
        }
        @keyframes gem-sparkle {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </defs>
    
    {/* Main celestial frame */}
    <circle cx="50" cy="50" r="40" stroke="#f97316" strokeWidth="2.5" style={{ animation: 'celestial-glow 3s infinite' }} />
    <circle cx="50" cy="50" r="38" stroke="#b45309" strokeWidth="1" opacity="0.6" />
    
    {/* Crown spikes - top */}
    <g style={{ animation: 'spike-pulse 1.5s infinite', transformOrigin: '50px 12px' }}>
      <polygon points="50,8 53,15 50,18 47,15" fill="#f97316" />
    </g>
    
    {/* Crown spikes - top right */}
    <g style={{ animation: 'spike-pulse 1.6s infinite 0.2s', transformOrigin: '71px 21px' }}>
      <polygon points="74,18 79,24 76,27 71,21" fill="#f97316" />
    </g>
    
    {/* Crown spikes - right */}
    <g style={{ animation: 'spike-pulse 1.7s infinite 0.4s', transformOrigin: '88px 50px' }}>
      <polygon points="92,50 85,53 82,50 85,47" fill="#f97316" />
    </g>
    
    {/* Crown spikes - bottom right */}
    <g style={{ animation: 'spike-pulse 1.6s infinite 0.6s', transformOrigin: '71px 79px' }}>
      <polygon points="74,82 79,76 76,73 71,79" fill="#f97316" />
    </g>
    
    {/* Crown spikes - bottom */}
    <g style={{ animation: 'spike-pulse 1.5s infinite 0.8s', transformOrigin: '50px 88px' }}>
      <polygon points="50,92 53,85 50,82 47,85" fill="#f97316" />
    </g>
    
    {/* Crown spikes - bottom left */}
    <g style={{ animation: 'spike-pulse 1.6s infinite 1s', transformOrigin: '29px 79px' }}>
      <polygon points="26,82 21,76 24,73 29,79" fill="#f97316" />
    </g>
    
    {/* Crown spikes - left */}
    <g style={{ animation: 'spike-pulse 1.7s infinite 1.2s', transformOrigin: '12px 50px' }}>
      <polygon points="8,50 15,53 18,50 15,47" fill="#f97316" />
    </g>
    
    {/* Crown spikes - top left */}
    <g style={{ animation: 'spike-pulse 1.6s infinite 1.4s', transformOrigin: '29px 21px' }}>
      <polygon points="26,18 21,24 24,27 29,21" fill="#f97316" />
    </g>
    
    {/* Top center diamond */}
    <polygon points="50,5 54,12 50,19 46,12" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.5" style={{ animation: 'gem-sparkle 2.5s infinite' }} />
    
    {/* Bottom center diamond */}
    <polygon points="50,95 54,88 50,81 46,88" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.5" style={{ animation: 'gem-sparkle 2.5s infinite 0.5s' }} />
    
    {/* Left center diamond */}
    <polygon points="3,50 10,55 3,60 -4,55" fill="#f5f5f4" stroke="#d4af37" strokeWidth="0.5" style={{ animation: 'gem-sparkle 2.5s infinite 0.3s' }} />
    
    {/* Right center diamond */}
    <polygon points="97,50 104,55 97,60 90,55" fill="#f5f5f4" stroke="#d4af37" strokeWidth="0.5" style={{ animation: 'gem-sparkle 2.5s infinite 0.6s' }} />
    
    {/* Rotating celestial ornaments */}
    <g style={{ animation: 'crown-rotate 10s infinite', transformOrigin: '50px 50px' }}>
      <circle cx="35" cy="25" r="1.5" fill="#fbbf24" opacity="0.8" />
      <circle cx="65" cy="25" r="1.5" fill="#fbbf24" opacity="0.8" />
      <circle cx="35" cy="75" r="1.5" fill="#b45309" opacity="0.8" />
      <circle cx="65" cy="75" r="1.5" fill="#b45309" opacity="0.8" />
    </g>
    
    {/* Twinkling stars */}
    <circle cx="20" cy="30" r="0.8" fill="#f5f5f4" style={{ animation: 'star-twinkle 2s infinite' }} />
    <circle cx="80" cy="30" r="0.8" fill="#f5f5f4" style={{ animation: 'star-twinkle 2.5s infinite 0.3s' }} />
    <circle cx="20" cy="70" r="0.8" fill="#f5f5f4" style={{ animation: 'star-twinkle 2.2s infinite 0.5s' }} />
    <circle cx="80" cy="70" r="0.8" fill="#f5f5f4" style={{ animation: 'star-twinkle 2.3s infinite 0.7s' }} />
    
    {/* Inner decorative circles */}
    <circle cx="50" cy="50" r="32" stroke="#f97316" strokeWidth="0.5" opacity="0.3" />
    <circle cx="50" cy="50" r="28" stroke="#b45309" strokeWidth="0.5" opacity="0.3" />
    
    {/* Celestial accent lines */}
    <path d="M 30 35 L 50 50 L 30 65" stroke="#fbbf24" strokeWidth="0.5" opacity="0.4" />
    <path d="M 70 35 L 50 50 L 70 65" stroke="#fbbf24" strokeWidth="0.5" opacity="0.4" />
    
    {/* Small accent stars */}
    <circle cx="40" cy="15" r="0.6" fill="#f5f5f4" style={{ animation: 'star-twinkle 1.5s infinite 0.2s' }} />
    <circle cx="60" cy="15" r="0.6" fill="#f5f5f4" style={{ animation: 'star-twinkle 1.5s infinite 0.4s' }} />
    <circle cx="40" cy="85" r="0.6" fill="#f5f5f4" style={{ animation: 'star-twinkle 1.5s infinite 0.6s' }} />
    <circle cx="60" cy="85" r="0.6" fill="#f5f5f4" style={{ animation: 'star-twinkle 1.5s infinite 0.8s' }} />
  </svg>
);

export default FrameCelestialCrown;
