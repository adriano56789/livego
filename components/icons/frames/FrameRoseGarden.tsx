import React from 'react';

/**
 * Frame 2: Rose Garden - Ultra Enhanced Version
 * Design: Ultra-detailed ornate frame with blooming roses and golden ornaments
 * Animations: Multi-layer petal bloom effects, rotating ornaments, twinkling gems, floating petals
 * Color Scheme: Hot pink (#ec4899), coral (#ff6b6b), purple (#a855f7), gold (#fbbf24), rose (#f43f5e)
 */
export const FrameRoseGarden: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    {...props}
    style={{
      filter: 'drop-shadow(0 0 15px rgba(236, 72, 153, 0.6)) drop-shadow(0 0 25px rgba(244, 63, 94, 0.4))',
      ...props.style
    }}
  >
    <defs>
      <style>{`
        @keyframes petal-bloom {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }
        @keyframes rotate-ornament {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes gem-pulse {
          0%, 100% { opacity: 0.6; filter: brightness(1); }
          50% { opacity: 1; filter: brightness(1.5); }
        }
        @keyframes float-up {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
          50% { transform: translateY(-4px) rotate(5deg); opacity: 1; }
        }
        @keyframes frame-glow {
          0%, 100% { stroke: #ec4899; filter: brightness(1); }
          50% { stroke: #f43f5e; filter: brightness(1.3) drop-shadow(0 0 4px rgba(244, 63, 94, 0.6)); }
        }
        @keyframes sparkle-float {
          0% { transform: translate(0px, 0px) scale(0); opacity: 0; }
          50% { transform: translate(var(--tx), var(--ty)) scale(1); opacity: 1; }
          100% { transform: translate(calc(var(--tx) * 2), calc(var(--ty) * 2)) scale(0); opacity: 0; }
        }
        @keyframes rose-twinkle {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
      
      {/* Ultra-enhanced gradients */}
      <radialGradient id="roseGlow">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="30%" stopColor="#fda4af" />
        <stop offset="70%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#be185d" />
      </radialGradient>
      
      <linearGradient id="roseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fda4af" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#be185d" />
      </linearGradient>
      
      <radialGradient id="goldenGlow">
        <stop offset="0%" stopColor="#fef3c7" />
        <stop offset="50%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#f59e0b" />
      </radialGradient>
      
      <radialGradient id="purpleGlow">
        <stop offset="0%" stopColor="#e9d5ff" />
        <stop offset="50%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#7c3aed" />
      </radialGradient>
      
      <filter id="megaGlow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge> 
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/> 
        </feMerge>
      </filter>
      
      <filter id="roseShine">
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
      stroke="url(#roseGradient)" 
      strokeWidth="0.5" 
      opacity="0.4" 
      filter="url(#megaGlow)"
    />
    <circle 
      cx="50" cy="50" r="43" 
      stroke="url(#goldenGlow)" 
      strokeWidth="1" 
      opacity="0.3" 
      filter="url(#megaGlow)"
    />
    
    {/* Main rose frame - enhanced */}
    <circle 
      cx="50" cy="50" r="40" 
      stroke="url(#roseGradient)" 
      strokeWidth="4" 
      style={{ animation: 'frame-glow 3s infinite' }}
      filter="url(#megaGlow)"
    />
    <circle 
      cx="50" cy="50" r="38" 
      stroke="#f43f5e" 
      strokeWidth="2" 
      opacity="0.6"
      style={{ animation: 'frame-glow 3.5s infinite 0.5s' }}
    />
    <circle 
      cx="50" cy="50" r="36" 
      stroke="#ff6b6b" 
      strokeWidth="1" 
      opacity="0.4"
      style={{ animation: 'gem-pulse 4s infinite 1s' }}
    />
    <circle 
      cx="50" cy="50" r="34" 
      stroke="#fda4af" 
      strokeWidth="0.5" 
      opacity="0.3"
    />
    
    {/* Ultra top rose cluster */}
    <g style={{ animation: 'petal-bloom 3s infinite', transformOrigin: '50px 12px' }}>
      {/* Large central rose */}
      <circle cx="50" cy="10" r="3" fill="url(#roseGlow)" stroke="#be185d" strokeWidth="0.8" filter="url(#roseShine)" />
      <circle cx="50" cy="10" r="2" fill="#ffffff" opacity="0.7" />
      
      {/* Surrounding petals */}
      <circle cx="47" cy="8" r="2" fill="#ec4899" style={{ animation: 'rose-twinkle 2s infinite 0.2s' }} />
      <circle cx="53" cy="8" r="2" fill="#f43f5e" style={{ animation: 'rose-twinkle 2s infinite 0.4s' }} />
      <circle cx="46" cy="12" r="2" fill="#ff6b6b" style={{ animation: 'rose-twinkle 2s infinite 0.6s' }} />
      <circle cx="54" cy="12" r="2" fill="#fda4af" style={{ animation: 'rose-twinkle 2s infinite 0.8s' }} />
      <circle cx="50" cy="14" r="1.5" fill="#ec4899" style={{ animation: 'rose-twinkle 2.2s infinite 1s' }} />
    </g>
    
    {/* Ultra left roses */}
    <g style={{ animation: 'petal-bloom 3.5s infinite 0.5s', transformOrigin: '10px 50px' }}>
      <circle cx="8" cy="48" r="2.5" fill="url(#roseGlow)" stroke="#be185d" strokeWidth="0.8" filter="url(#roseShine)" />
      <circle cx="8" cy="48" r="1.5" fill="#ffffff" opacity="0.7" />
      <circle cx="8" cy="52" r="2.5" fill="url(#roseGlow)" stroke="#be185d" strokeWidth="0.8" filter="url(#roseShine)" />
      <circle cx="8" cy="52" r="1.5" fill="#ffffff" opacity="0.7" />
      <circle cx="6" cy="50" r="2" fill="#ec4899" style={{ animation: 'rose-twinkle 1.8s infinite 0.3s' }} />
      <circle cx="12" cy="49" r="1.5" fill="#f43f5e" style={{ animation: 'rose-twinkle 2s infinite 0.5s' }} />
      <circle cx="12" cy="51" r="1.5" fill="#ff6b6b" style={{ animation: 'rose-twinkle 2.2s infinite 0.7s' }} />
    </g>
    
    {/* Ultra right roses */}
    <g style={{ animation: 'petal-bloom 3.2s infinite 0.3s', transformOrigin: '90px 50px' }}>
      <circle cx="92" cy="48" r="2.5" fill="url(#roseGlow)" stroke="#be185d" strokeWidth="0.8" filter="url(#roseShine)" />
      <circle cx="92" cy="48" r="1.5" fill="#ffffff" opacity="0.7" />
      <circle cx="92" cy="52" r="2.5" fill="url(#roseGlow)" stroke="#be185d" strokeWidth="0.8" filter="url(#roseShine)" />
      <circle cx="92" cy="52" r="1.5" fill="#ffffff" opacity="0.7" />
      <circle cx="94" cy="50" r="2" fill="#ec4899" style={{ animation: 'rose-twinkle 1.9s infinite 0.4s' }} />
      <circle cx="88" cy="49" r="1.5" fill="#f43f5e" style={{ animation: 'rose-twinkle 2.1s infinite 0.6s' }} />
      <circle cx="88" cy="51" r="1.5" fill="#ff6b6b" style={{ animation: 'rose-twinkle 2.3s infinite 0.8s' }} />
    </g>
    
    {/* Ultra bottom rose cluster */}
    <g style={{ animation: 'petal-bloom 2.8s infinite 0.7s', transformOrigin: '50px 88px' }}>
      <circle cx="50" cy="90" r="3" fill="url(#roseGlow)" stroke="#be185d" strokeWidth="0.8" filter="url(#roseShine)" />
      <circle cx="50" cy="90" r="2" fill="#ffffff" opacity="0.7" />
      <circle cx="47" cy="88" r="2" fill="#ec4899" style={{ animation: 'rose-twinkle 2s infinite 0.2s' }} />
      <circle cx="53" cy="88" r="2" fill="#f43f5e" style={{ animation: 'rose-twinkle 2s infinite 0.4s' }} />
      <circle cx="46" cy="92" r="2" fill="#ff6b6b" style={{ animation: 'rose-twinkle 2s infinite 0.6s' }} />
      <circle cx="54" cy="92" r="2" fill="#fda4af" style={{ animation: 'rose-twinkle 2s infinite 0.8s' }} />
      <circle cx="50" cy="86" r="1.5" fill="#ec4899" style={{ animation: 'rose-twinkle 2.2s infinite 1s' }} />
    </g>
    
    {/* Ultra top center diamond */}
    <g style={{ animation: 'float-up 2.5s infinite', transformOrigin: '50px 8px' }}>
      <polygon points="50,4 55,12 50,20 45,12" fill="url(#goldenGlow)" stroke="#f59e0b" strokeWidth="1" filter="url(#roseShine)" />
      <polygon points="50,4 55,12 50,20 45,12" fill="#fef3c7" opacity="0.3" />
      <polygon points="50,8 52,12 50,16 48,12" fill="#ffffff" opacity="0.8" />
    </g>
    
    {/* Ultra bottom center diamond */}
    <g style={{ animation: 'float-up 2.5s infinite 1s', transformOrigin: '50px 92px' }}>
      <polygon points="50,96 55,88 50,80 45,88" fill="url(#goldenGlow)" stroke="#f59e0b" strokeWidth="1" filter="url(#roseShine)" />
      <polygon points="50,96 55,88 50,80 45,88" fill="#fef3c7" opacity="0.3" />
      <polygon points="50,92 52,88 50,84 48,88" fill="#ffffff" opacity="0.8" />
    </g>
    
    {/* Ultra left center diamond */}
    <g style={{ animation: 'float-up 2.8s infinite 0.3s', transformOrigin: '4px 50px' }}>
      <polygon points="4,46 12,54 4,62 -4,54" fill="url(#purpleGlow)" stroke="#7c3aed" strokeWidth="1" filter="url(#roseShine)" />
      <polygon points="4,46 12,54 4,62 -4,54" fill="#e9d5ff" opacity="0.3" />
      <polygon points="4,50 6,54 4,58 2,54" fill="#ffffff" opacity="0.8" />
    </g>
    
    {/* Ultra right center diamond */}
    <g style={{ animation: 'float-up 2.8s infinite 0.6s', transformOrigin: '96px 50px' }}>
      <polygon points="96,46 104,54 96,62 88,54" fill="url(#purpleGlow)" stroke="#7c3aed" strokeWidth="1" filter="url(#roseShine)" />
      <polygon points="96,46 104,54 96,62 88,54" fill="#e9d5ff" opacity="0.3" />
      <polygon points="96,50 98,54 96,58 94,54" fill="#ffffff" opacity="0.8" />
    </g>
    
    {/* Ultra decorative ornaments */}
    <g style={{ animation: 'rotate-ornament 12s infinite', transformOrigin: '50px 50px' }}>
      <circle cx="35" cy="25" r="2" fill="url(#goldenGlow)" stroke="#f59e0b" strokeWidth="0.5" opacity="0.9" filter="url(#roseShine)" />
      <circle cx="65" cy="25" r="2" fill="url(#goldenGlow)" stroke="#f59e0b" strokeWidth="0.5" opacity="0.9" filter="url(#roseShine)" />
      <circle cx="35" cy="75" r="2" fill="url(#goldenGlow)" stroke="#f59e0b" strokeWidth="0.5" opacity="0.9" filter="url(#roseShine)" />
      <circle cx="65" cy="75" r="2" fill="url(#goldenGlow)" stroke="#f59e0b" strokeWidth="0.5" opacity="0.9" filter="url(#roseShine)" />
      
      {/* Small decorative dots */}
      <circle cx="30" cy="30" r="1" fill="#fbbf24" opacity="0.8" />
      <circle cx="70" cy="30" r="1" fill="#fbbf24" opacity="0.8" />
      <circle cx="30" cy="70" r="1" fill="#fbbf24" opacity="0.8" />
      <circle cx="70" cy="70" r="1" fill="#fbbf24" opacity="0.8" />
    </g>
    
    {/* Ultra small floating petals */}
    <g>
      <circle cx="25" cy="30" r="1.2" fill="#fda4af" style={{ animation: 'float-up 2s infinite' }} />
      <circle cx="75" cy="35" r="1.2" fill="#ec4899" style={{ animation: 'float-up 2.3s infinite 0.3s' }} />
      <circle cx="30" cy="70" r="1.2" fill="#f43f5e" style={{ animation: 'float-up 2.1s infinite 0.5s' }} />
      <circle cx="70" cy="65" r="1.2" fill="#ff6b6b" style={{ animation: 'float-up 2.4s infinite 0.7s' }} />
      
      {/* Micro sparkle dots */}
      <circle cx="35" cy="25" r="0.6" fill="#ffffff" style={{ animation: 'sparkle-float 1.5s infinite', '--tx': '1px', '--ty': '-2px' }} />
      <circle cx="65" cy="25" r="0.6" fill="#ffffff" style={{ animation: 'sparkle-float 1.7s infinite 0.2s', '--tx': '-1px', '--ty': '-2px' }} />
      <circle cx="35" cy="75" r="0.6" fill="#ffffff" style={{ animation: 'sparkle-float 1.6s infinite 0.4s', '--tx': '1px', '--ty': '2px' }} />
      <circle cx="65" cy="75" r="0.6" fill="#ffffff" style={{ animation: 'sparkle-float 1.8s infinite 0.6s', '--tx': '-1px', '--ty': '2px' }} />
    </g>
    
    {/* Inner rose rings */}
    <circle 
      cx="50" cy="50" 
      r="28" 
      stroke="url(#roseGradient)" 
      strokeWidth="0.8" 
      opacity="0.5" 
      style={{ animation: 'gem-pulse 5s infinite 2s' }}
    />
    <circle 
      cx="50" cy="50" 
      r="24" 
      stroke="#f43f5e" 
      strokeWidth="0.5" 
      opacity="0.3"
    />
    <circle 
      cx="50" cy="50" 
      r="20" 
      stroke="#fda4af" 
      strokeWidth="0.3" 
      opacity="0.2"
    />
    
    {/* Central core */}
    <circle 
      cx="50" cy="50" 
      r="8" 
      fill="url(#roseGlow)" 
      opacity="0.4" 
      style={{ animation: 'gem-pulse 3s infinite 1.5s' }}
    />
    <circle 
      cx="50" cy="50" 
      r="4" 
      fill="#ffffff" 
      opacity="0.8" 
      filter="url(#roseShine)"
    />
  </svg>
);

export default FrameRoseGarden;
