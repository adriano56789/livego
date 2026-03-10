import React from 'react';

/**
 * Frame 3: Copper Pearls - Ultra Enhanced Version
 * Design: Ultra-detailed warm copper frame adorned with pearl beads and golden ornaments
 * Animations: Multi-layer pearl sequence, shimmer effects, gentle bobbing, golden glow
 * Color Scheme: Copper (#b45309), warm gold (#fbbf24), pearl white (#f5f5f4), bronze (#d97706)
 */
export const FrameCopperPearls: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    {...props}
    style={{
      filter: 'drop-shadow(0 0 15px rgba(251, 191, 36, 0.6)) drop-shadow(0 0 25px rgba(180, 83, 9, 0.4))',
      ...props.style
    }}
  >
    <defs>
      <style>{`
        @keyframes pearl-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pearl-shimmer {
          0%, 100% { opacity: 0.7; filter: brightness(1) drop-shadow(0 0 2px rgba(251, 191, 36, 0.3)); }
          50% { opacity: 1; filter: brightness(1.4) drop-shadow(0 0 6px rgba(251, 191, 36, 0.9)); }
        }
        @keyframes pearl-bob {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-3px) scale(1.1); }
        }
        @keyframes frame-glow {
          0%, 100% { stroke: #b45309; filter: brightness(1); }
          50% { stroke: #d97706; filter: brightness(1.3) drop-shadow(0 0 4px rgba(217, 119, 6, 0.6)); }
        }
        @keyframes golden-pulse {
          0%, 100% { opacity: 0.6; filter: brightness(1); }
          50% { opacity: 1; filter: brightness(1.5); }
        }
        @keyframes ornate-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes sparkle-float {
          0% { transform: translate(0px, 0px) scale(0); opacity: 0; }
          50% { transform: translate(var(--tx), var(--ty)) scale(1); opacity: 1; }
          100% { transform: translate(calc(var(--tx) * 2), calc(var(--ty) * 2)) scale(0); opacity: 0; }
        }
      `}</style>
      
      {/* Ultra-enhanced gradients */}
      <radialGradient id="pearlGlow">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="30%" stopColor="#fef3c7" />
        <stop offset="70%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#d97706" />
      </radialGradient>
      
      <linearGradient id="copperGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="50%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      
      <radialGradient id="goldenGlow">
        <stop offset="0%" stopColor="#fef3c7" />
        <stop offset="50%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#f59e0b" />
      </radialGradient>
      
      <filter id="megaGlow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge> 
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/> 
        </feMerge>
      </filter>
      
      <filter id="pearlShine">
        <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
        <feMerge> 
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/> 
        </feMerge>
      </filter>
    </defs>
    
    {/* Ultra outer glow rings */}
    <circle 
      cx="50" cy="50" r="45" 
      stroke="url(#goldenGlow)" 
      strokeWidth="0.5" 
      opacity="0.4" 
      filter="url(#megaGlow)"
    />
    <circle 
      cx="50" cy="50" r="43" 
      stroke="url(#copperGradient)" 
      strokeWidth="1" 
      opacity="0.3" 
      filter="url(#megaGlow)"
    />
    
    {/* Main copper frame - enhanced */}
    <circle 
      cx="50" cy="50" r="40" 
      stroke="url(#copperGradient)" 
      strokeWidth="4" 
      style={{ animation: 'frame-glow 3s infinite' }}
      filter="url(#megaGlow)"
    />
    <circle 
      cx="50" cy="50" r="38" 
      stroke="#d97706" 
      strokeWidth="2" 
      opacity="0.6"
      style={{ animation: 'frame-glow 3.5s infinite 0.5s' }}
    />
    <circle 
      cx="50" cy="50" r="36" 
      stroke="#fbbf24" 
      strokeWidth="1" 
      opacity="0.4"
      style={{ animation: 'golden-pulse 4s infinite 1s' }}
    />
    <circle 
      cx="50" cy="50" r="34" 
      stroke="#fef3c7" 
      strokeWidth="0.5" 
      opacity="0.3"
    />
    
    {/* Ultra pearl beads arranged in circle */}
    <g style={{ animation: 'pearl-rotate 10s infinite', transformOrigin: '50px 50px' }}>
      {/* Top mega pearl */}
      <circle cx="50" cy="10" r="3.5" fill="url(#pearlGlow)" stroke="#d4af37" strokeWidth="1" style={{ animation: 'pearl-shimmer 2s infinite' }} filter="url(#pearlShine)" />
      <circle cx="50" cy="10" r="2" fill="#ffffff" opacity="0.8" />
      
      {/* Upper right mega pearl */}
      <circle cx="73" cy="19" r="3.5" fill="url(#pearlGlow)" stroke="#d4af37" strokeWidth="1" style={{ animation: 'pearl-shimmer 2s infinite 0.2s' }} filter="url(#pearlShine)" />
      <circle cx="73" cy="19" r="2" fill="#ffffff" opacity="0.8" />
      
      {/* Right mega pearl */}
      <circle cx="90" cy="50" r="3.5" fill="url(#pearlGlow)" stroke="#d4af37" strokeWidth="1" style={{ animation: 'pearl-shimmer 2s infinite 0.4s' }} filter="url(#pearlShine)" />
      <circle cx="90" cy="50" r="2" fill="#ffffff" opacity="0.8" />
      
      {/* Lower right mega pearl */}
      <circle cx="73" cy="81" r="3.5" fill="url(#pearlGlow)" stroke="#d4af37" strokeWidth="1" style={{ animation: 'pearl-shimmer 2s infinite 0.6s' }} filter="url(#pearlShine)" />
      <circle cx="73" cy="81" r="2" fill="#ffffff" opacity="0.8" />
      
      {/* Bottom mega pearl */}
      <circle cx="50" cy="90" r="3.5" fill="url(#pearlGlow)" stroke="#d4af37" strokeWidth="1" style={{ animation: 'pearl-shimmer 2s infinite 0.8s' }} filter="url(#pearlShine)" />
      <circle cx="50" cy="90" r="2" fill="#ffffff" opacity="0.8" />
      
      {/* Lower left mega pearl */}
      <circle cx="27" cy="81" r="3.5" fill="url(#pearlGlow)" stroke="#d4af37" strokeWidth="1" style={{ animation: 'pearl-shimmer 2s infinite 1s' }} filter="url(#pearlShine)" />
      <circle cx="27" cy="81" r="2" fill="#ffffff" opacity="0.8" />
      
      {/* Left mega pearl */}
      <circle cx="10" cy="50" r="3.5" fill="url(#pearlGlow)" stroke="#d4af37" strokeWidth="1" style={{ animation: 'pearl-shimmer 2s infinite 1.2s' }} filter="url(#pearlShine)" />
      <circle cx="10" cy="50" r="2" fill="#ffffff" opacity="0.8" />
      
      {/* Upper left mega pearl */}
      <circle cx="27" cy="19" r="3.5" fill="url(#pearlGlow)" stroke="#d4af37" strokeWidth="1" style={{ animation: 'pearl-shimmer 2s infinite 1.4s' }} filter="url(#pearlShine)" />
      <circle cx="27" cy="19" r="2" fill="#ffffff" opacity="0.8" />
    </g>
    
    {/* Top center ultra diamond */}
    <g style={{ animation: 'pearl-bob 2s infinite', transformOrigin: '50px 10px' }}>
      <polygon points="50,6 55,14 50,22 45,14" fill="url(#goldenGlow)" stroke="#f59e0b" strokeWidth="1" filter="url(#pearlShine)" />
      <polygon points="50,6 55,14 50,22 45,14" fill="#fef3c7" opacity="0.3" />
      <polygon points="50,10 52,14 50,18 48,14" fill="#ffffff" opacity="0.8" />
    </g>
    
    {/* Bottom center ultra diamond */}
    <g style={{ animation: 'pearl-bob 2s infinite 1s', transformOrigin: '50px 90px' }}>
      <polygon points="50,94 55,86 50,78 45,86" fill="url(#goldenGlow)" stroke="#f59e0b" strokeWidth="1" filter="url(#pearlShine)" />
      <polygon points="50,94 55,86 50,78 45,86" fill="#fef3c7" opacity="0.3" />
      <polygon points="50,90 52,86 50,82 48,86" fill="#ffffff" opacity="0.8" />
    </g>
    
    {/* Left center ultra diamond */}
    <g style={{ animation: 'pearl-bob 2.2s infinite 0.3s', transformOrigin: '6px 50px' }}>
      <polygon points="6,46 14,53 6,60 -2,53" fill="url(#goldenGlow)" stroke="#f59e0b" strokeWidth="1" filter="url(#pearlShine)" />
      <polygon points="6,46 14,53 6,60 -2,53" fill="#fef3c7" opacity="0.3" />
      <polygon points="6,50 8,53 6,56 4,53" fill="#ffffff" opacity="0.8" />
    </g>
    
    {/* Right center ultra diamond */}
    <g style={{ animation: 'pearl-bob 2.2s infinite 0.6s', transformOrigin: '94px 50px' }}>
      <polygon points="94,46 102,53 94,60 86,53" fill="url(#goldenGlow)" stroke="#f59e0b" strokeWidth="1" filter="url(#pearlShine)" />
      <polygon points="94,46 102,53 94,60 86,53" fill="#fef3c7" opacity="0.3" />
      <polygon points="94,50 96,53 94,56 92,53" fill="#ffffff" opacity="0.8" />
    </g>
    
    {/* Ultra decorative smaller pearls */}
    <g>
      <circle cx="32" cy="28" r="1.5" fill="url(#pearlGlow)" stroke="#d4af37" strokeWidth="0.5" style={{ animation: 'pearl-shimmer 1.5s infinite 0.3s' }} filter="url(#pearlShine)" />
      <circle cx="68" cy="28" r="1.5" fill="url(#pearlGlow)" stroke="#d4af37" strokeWidth="0.5" style={{ animation: 'pearl-shimmer 1.5s infinite 0.5s' }} filter="url(#pearlShine)" />
      <circle cx="68" cy="72" r="1.5" fill="url(#pearlGlow)" stroke="#d4af37" strokeWidth="0.5" style={{ animation: 'pearl-shimmer 1.5s infinite 0.7s' }} filter="url(#pearlShine)" />
      <circle cx="32" cy="72" r="1.5" fill="url(#pearlGlow)" stroke="#d4af37" strokeWidth="0.5" style={{ animation: 'pearl-shimmer 1.5s infinite 0.9s' }} filter="url(#pearlShine)" />
      
      {/* Micro pearls */}
      <circle cx="40" cy="35" r="0.8" fill="#fef3c7" style={{ animation: 'sparkle-float 1.2s infinite', '--tx': '1px', '--ty': '-2px' }} />
      <circle cx="60" cy="35" r="0.8" fill="#fef3c7" style={{ animation: 'sparkle-float 1.4s infinite 0.2s', '--tx': '-1px', '--ty': '-2px' }} />
      <circle cx="40" cy="65" r="0.8" fill="#fef3c7" style={{ animation: 'sparkle-float 1.3s infinite 0.4s', '--tx': '1px', '--ty': '2px' }} />
      <circle cx="60" cy="65" r="0.8" fill="#fef3c7" style={{ animation: 'sparkle-float 1.5s infinite 0.6s', '--tx': '-1px', '--ty': '2px' }} />
    </g>
    
    {/* Ultra ornamental copper accents */}
    <g style={{ animation: 'ornate-rotate 15s infinite', transformOrigin: '50px 50px' }}>
      <path d="M 30 35 Q 35 28 40 35" stroke="url(#goldenGlow)" strokeWidth="1.5" fill="none" opacity="0.8" filter="url(#pearlShine)" />
      <path d="M 70 35 Q 65 28 60 35" stroke="url(#goldenGlow)" strokeWidth="1.5" fill="none" opacity="0.8" filter="url(#pearlShine)" />
      <path d="M 30 65 Q 35 72 40 65" stroke="url(#goldenGlow)" strokeWidth="1.5" fill="none" opacity="0.8" filter="url(#pearlShine)" />
      <path d="M 70 65 Q 65 72 60 65" stroke="url(#goldenGlow)" strokeWidth="1.5" fill="none" opacity="0.8" filter="url(#pearlShine)" />
      
      {/* Decorative dots */}
      <circle cx="35" cy="32" r="1" fill="#fbbf24" opacity="0.9" />
      <circle cx="65" cy="32" r="1" fill="#fbbf24" opacity="0.9" />
      <circle cx="35" cy="68" r="1" fill="#fbbf24" opacity="0.9" />
      <circle cx="65" cy="68" r="1" fill="#fbbf24" opacity="0.9" />
    </g>
    
    {/* Inner copper rings */}
    <circle 
      cx="50" cy="50" 
      r="28" 
      stroke="url(#copperGradient)" 
      strokeWidth="0.8" 
      opacity="0.5" 
      style={{ animation: 'golden-pulse 5s infinite 2s' }}
    />
    <circle 
      cx="50" cy="50" 
      r="24" 
      stroke="#d97706" 
      strokeWidth="0.5" 
      opacity="0.3"
    />
    <circle 
      cx="50" cy="50" 
      r="20" 
      stroke="#fbbf24" 
      strokeWidth="0.3" 
      opacity="0.2"
    />
    
    {/* Central core */}
    <circle 
      cx="50" cy="50" 
      r="8" 
      fill="url(#goldenGlow)" 
      opacity="0.4" 
      style={{ animation: 'golden-pulse 3s infinite 1.5s' }}
    />
    <circle 
      cx="50" cy="50" 
      r="4" 
      fill="#ffffff" 
      opacity="0.8" 
      filter="url(#pearlShine)"
    />
  </svg>
);

export default FrameCopperPearls;
