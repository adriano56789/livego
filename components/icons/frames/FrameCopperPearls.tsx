import React from 'react';

/**
 * Frame 3: Copper Pearls
 * Design: Warm copper frame adorned with pearl beads
 * Animations: Rotating pearl sequence, shimmer effects, gentle bobbing
 * Color Scheme: Copper (#b45309), warm gold (#fbbf24), pearl white (#f5f5f4)
 */
export const FrameCopperPearls: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <style>{`
        @keyframes pearl-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pearl-shimmer {
          0%, 100% { opacity: 0.7; filter: drop-shadow(0 0 1px rgba(251, 191, 36, 0.3)); }
          50% { opacity: 1; filter: drop-shadow(0 0 3px rgba(251, 191, 36, 0.8)); }
        }
        @keyframes pearl-bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        @keyframes frame-glow {
          0%, 100% { stroke: #b45309; filter: drop-shadow(0 0 2px rgba(180, 83, 9, 0.3)); }
          50% { stroke: #d97706; filter: drop-shadow(0 0 4px rgba(217, 119, 6, 0.6)); }
        }
      `}</style>
    </defs>
    
    {/* Main copper frame */}
    <circle cx="50" cy="50" r="40" strokeWidth="3" style={{ animation: 'frame-glow 4s infinite' }} />
    <circle cx="50" cy="50" r="38" stroke="#d97706" strokeWidth="1" opacity="0.5" />
    
    {/* Pearl beads arranged in circle */}
    <g style={{ animation: 'pearl-rotate 12s infinite', transformOrigin: '50px 50px' }}>
      {/* Top pearl */}
      <circle cx="50" cy="12" r="2.5" fill="#f5f5f4" stroke="#d4af37" strokeWidth="0.5" style={{ animation: 'pearl-shimmer 2s infinite' }} />
      
      {/* Upper right pearl */}
      <circle cx="71" cy="21" r="2.5" fill="#f5f5f4" stroke="#d4af37" strokeWidth="0.5" style={{ animation: 'pearl-shimmer 2s infinite 0.2s' }} />
      
      {/* Right pearl */}
      <circle cx="88" cy="50" r="2.5" fill="#f5f5f4" stroke="#d4af37" strokeWidth="0.5" style={{ animation: 'pearl-shimmer 2s infinite 0.4s' }} />
      
      {/* Lower right pearl */}
      <circle cx="71" cy="79" r="2.5" fill="#f5f5f4" stroke="#d4af37" strokeWidth="0.5" style={{ animation: 'pearl-shimmer 2s infinite 0.6s' }} />
      
      {/* Bottom pearl */}
      <circle cx="50" cy="88" r="2.5" fill="#f5f5f4" stroke="#d4af37" strokeWidth="0.5" style={{ animation: 'pearl-shimmer 2s infinite 0.8s' }} />
      
      {/* Lower left pearl */}
      <circle cx="29" cy="79" r="2.5" fill="#f5f5f4" stroke="#d4af37" strokeWidth="0.5" style={{ animation: 'pearl-shimmer 2s infinite 1s' }} />
      
      {/* Left pearl */}
      <circle cx="12" cy="50" r="2.5" fill="#f5f5f4" stroke="#d4af37" strokeWidth="0.5" style={{ animation: 'pearl-shimmer 2s infinite 1.2s' }} />
      
      {/* Upper left pearl */}
      <circle cx="29" cy="21" r="2.5" fill="#f5f5f4" stroke="#d4af37" strokeWidth="0.5" style={{ animation: 'pearl-shimmer 2s infinite 1.4s' }} />
    </g>
    
    {/* Top center diamond */}
    <polygon points="50,8 54,14 50,20 46,14" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="0.5" style={{ animation: 'pearl-bob 2.5s infinite' }} />
    
    {/* Bottom center diamond */}
    <polygon points="50,92 54,86 50,80 46,86" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="0.5" style={{ animation: 'pearl-bob 2.5s infinite 0.5s' }} />
    
    {/* Decorative smaller pearls */}
    <circle cx="35" cy="30" r="1.2" fill="#fef3c7" stroke="#d4af37" strokeWidth="0.3" style={{ animation: 'pearl-shimmer 1.5s infinite 0.3s' }} />
    <circle cx="65" cy="30" r="1.2" fill="#fef3c7" stroke="#d4af37" strokeWidth="0.3" style={{ animation: 'pearl-shimmer 1.5s infinite 0.5s' }} />
    <circle cx="65" cy="70" r="1.2" fill="#fef3c7" stroke="#d4af37" strokeWidth="0.3" style={{ animation: 'pearl-shimmer 1.5s infinite 0.7s' }} />
    <circle cx="35" cy="70" r="1.2" fill="#fef3c7" stroke="#d4af37" strokeWidth="0.3" style={{ animation: 'pearl-shimmer 1.5s infinite 0.9s' }} />
    
    {/* Ornamental copper accents */}
    <path d="M 30 35 Q 35 30 40 35" stroke="#b45309" strokeWidth="1" fill="none" opacity="0.6" />
    <path d="M 70 35 Q 65 30 60 35" stroke="#b45309" strokeWidth="1" fill="none" opacity="0.6" />
    <path d="M 30 65 Q 35 70 40 65" stroke="#b45309" strokeWidth="1" fill="none" opacity="0.6" />
    <path d="M 70 65 Q 65 70 60 65" stroke="#b45309" strokeWidth="1" fill="none" opacity="0.6" />
  </svg>
);

export default FrameCopperPearls;
