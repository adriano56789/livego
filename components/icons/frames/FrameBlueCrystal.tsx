import React from 'react';

/**
 * Frame 1: Blue Crystal - Enhanced Version
 * Design: Ultra-detailed neon blue circular frame with crystalline diamonds
 * Animations: Multi-layer pulsing glow, rotating diamond sparkles, floating particles
 * Color Scheme: Electric blue (#4338ca), cyan (#0ea5e9), bright blue (#3b82f6), white highlights
 */
export const FrameBlueCrystal: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    {...props}
    style={{
      filter: 'drop-shadow(0 0 15px rgba(67, 56, 202, 0.6)) drop-shadow(0 0 30px rgba(14, 165, 233, 0.4))',
      ...props.style
    }}
  >
    <defs>
      <style>{`
        @keyframes crystal-pulse {
          0%, 100% { opacity: 0.8; filter: brightness(1); }
          50% { opacity: 1; filter: brightness(1.3); }
        }
        @keyframes diamond-rotate {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes sparkle-twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        @keyframes crystal-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(5deg); }
        }
        @keyframes beam-pulse {
          0%, 100% { opacity: 0.2; stroke-width: 0.5; }
          50% { opacity: 1; stroke-width: 1.5; }
        }
        @keyframes particle-float {
          0% { transform: translate(0px, 0px) scale(0); opacity: 0; }
          50% { transform: translate(var(--tx), var(--ty)) scale(1); opacity: 1; }
          100% { transform: translate(calc(var(--tx) * 2), calc(var(--ty) * 2)) scale(0); opacity: 0; }
        }
        @keyframes glow-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Ultra-enhanced gradients */}
      <linearGradient id="crystalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4338ca" />
        <stop offset="30%" stopColor="#3b82f6" />
        <stop offset="70%" stopColor="#0ea5e9" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
      
      <radialGradient id="diamondGlow">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="30%" stopColor="#e0f2fe" />
        <stop offset="70%" stopColor="#0ea5e9" />
        <stop offset="100%" stopColor="#3b82f6" />
      </radialGradient>
      
      <radialGradient id="superGlow">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="50%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1e40af" />
      </radialGradient>
      
      <filter id="megaGlow">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feMerge> 
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/> 
        </feMerge>
      </filter>
      
      <filter id="sparkleFilter">
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
      stroke="url(#superGlow)" 
      strokeWidth="0.5" 
      opacity="0.6" 
      filter="url(#megaGlow)"
      style={{ animation: 'glow-rotate 20s infinite linear' }}
    />
    <circle 
      cx="50" cy="50" r="43" 
      stroke="url(#crystalGradient)" 
      strokeWidth="1" 
      opacity="0.4" 
      filter="url(#megaGlow)"
    />
    
    {/* Main circular frame - enhanced */}
    <circle 
      cx="50" cy="50" r="40" 
      stroke="url(#crystalGradient)" 
      strokeWidth="4" 
      style={{ animation: 'crystal-pulse 2s infinite' }}
      filter="url(#megaGlow)"
    />
    <circle 
      cx="50" cy="50" r="38" 
      stroke="#3b82f6" 
      strokeWidth="2" 
      opacity="0.7"
      style={{ animation: 'crystal-pulse 2.5s infinite 0.5s' }}
    />
    <circle 
      cx="50" cy="50" r="36" 
      stroke="#0ea5e9" 
      strokeWidth="1" 
      opacity="0.5"
      style={{ animation: 'crystal-pulse 3s infinite 1s' }}
    />
    <circle 
      cx="50" cy="50" r="34" 
      stroke="#60a5fa" 
      strokeWidth="0.5" 
      opacity="0.3"
    />
    
    {/* Crystal beam lines - enhanced */}
    <g style={{ animation: 'beam-pulse 2s infinite' }}>
      <line x1="50" y1="8" x2="50" y2="25" stroke="#ffffff" strokeWidth="1" opacity="0.8" />
      <line x1="50" y1="75" x2="50" y2="92" stroke="#ffffff" strokeWidth="1" opacity="0.8" />
      <line x1="8" y1="50" x2="25" y2="50" stroke="#ffffff" strokeWidth="1" opacity="0.8" />
      <line x1="75" y1="50" x2="92" y2="50" stroke="#ffffff" strokeWidth="1" opacity="0.8" />
      
      {/* Diagonal beams */}
      <line x1="25" y1="25" x2="35" y2="35" stroke="#60a5fa" strokeWidth="0.5" opacity="0.6" />
      <line x1="75" y1="25" x2="65" y2="35" stroke="#60a5fa" strokeWidth="0.5" opacity="0.6" />
      <line x1="25" y1="75" x2="35" y2="65" stroke="#60a5fa" strokeWidth="0.5" opacity="0.6" />
      <line x1="75" y1="75" x2="65" y2="65" stroke="#60a5fa" strokeWidth="0.5" opacity="0.6" />
    </g>
    
    {/* Ultra large central rotating diamond */}
    <g style={{ animation: 'diamond-rotate 6s infinite', transformOrigin: '50px 50px' }}>
      <polygon 
        points="50,12 60,25 50,38 40,25" 
        fill="url(#diamondGlow)" 
        stroke="#ffffff" 
        strokeWidth="1" 
        filter="url(#sparkleFilter)"
      />
      <polygon 
        points="50,12 60,25 50,38 40,25" 
        fill="#ffffff" 
        opacity="0.2" 
      />
      {/* Inner diamond detail */}
      <polygon 
        points="50,18 54,25 50,32 46,25" 
        fill="url(#superGlow)" 
        opacity="0.8" 
      />
    </g>
    
    {/* Secondary rotating diamond */}
    <g style={{ animation: 'diamond-rotate 8s infinite reverse', transformOrigin: '50px 50px' }}>
      <polygon 
        points="50,62 60,75 50,88 40,75" 
        fill="url(#diamondGlow)" 
        stroke="#ffffff" 
        strokeWidth="1" 
        filter="url(#sparkleFilter)"
      />
      <polygon 
        points="50,62 60,75 50,88 40,75" 
        fill="#ffffff" 
        opacity="0.2" 
      />
      <polygon 
        points="50,68 54,75 50,82 46,75" 
        fill="url(#superGlow)" 
        opacity="0.8" 
      />
    </g>
    
    {/* Left mega crystal cluster */}
    <g style={{ animation: 'crystal-float 2.5s infinite', transformOrigin: '15px 50px' }}>
      <polygon 
        points="15,38 24,47 15,56 6,47" 
        fill="url(#diamondGlow)" 
        stroke="#ffffff" 
        strokeWidth="0.8" 
        style={{ animation: 'sparkle-twinkle 2s infinite' }}
        filter="url(#sparkleFilter)"
      />
      <polygon 
        points="15,38 24,47 15,56 6,47" 
        fill="url(#superGlow)" 
        opacity="0.3" 
      />
      <circle cx="15" cy="47" r="3" fill="#ffffff" opacity="0.9" filter="url(#sparkleFilter)" />
      <circle cx="15" cy="47" r="1.5" fill="#e0f2fe" />
    </g>
    
    {/* Right mega crystal cluster */}
    <g style={{ animation: 'crystal-float 2.5s infinite 1.2s', transformOrigin: '85px 50px' }}>
      <polygon 
        points="85,38 94,47 85,56 76,47" 
        fill="url(#diamondGlow)" 
        stroke="#ffffff" 
        strokeWidth="0.8" 
        style={{ animation: 'sparkle-twinkle 2s infinite 0.6s' }}
        filter="url(#sparkleFilter)"
      />
      <polygon 
        points="85,38 94,47 85,56 76,47" 
        fill="url(#superGlow)" 
        opacity="0.3" 
      />
      <circle cx="85" cy="47" r="3" fill="#ffffff" opacity="0.9" filter="url(#sparkleFilter)" />
      <circle cx="85" cy="47" r="1.5" fill="#e0f2fe" />
    </g>
    
    {/* Top ultra floating crystals */}
    <g>
      <polygon 
        points="32,18 36,22 32,26 28,22" 
        fill="url(#diamondGlow)" 
        stroke="#ffffff" 
        strokeWidth="0.5" 
        style={{ animation: 'sparkle-twinkle 1.8s infinite' }}
        filter="url(#sparkleFilter)"
      />
      <polygon 
        points="68,18 72,22 68,26 64,22" 
        fill="url(#diamondGlow)" 
        stroke="#ffffff" 
        strokeWidth="0.5" 
        style={{ animation: 'sparkle-twinkle 2s infinite 0.3s' }}
        filter="url(#sparkleFilter)"
      />
      <polygon 
        points="50,8 54,14 50,20 46,14" 
        fill="#ffffff" 
        stroke="#3b82f6" 
        strokeWidth="0.5" 
        style={{ animation: 'crystal-float 2.2s infinite' }}
        filter="url(#sparkleFilter)"
      />
    </g>
    
    {/* Bottom ultra floating crystals */}
    <g>
      <polygon 
        points="32,82 36,78 32,74 28,78" 
        fill="url(#diamondGlow)" 
        stroke="#ffffff" 
        strokeWidth="0.5" 
        style={{ animation: 'sparkle-twinkle 2.1s infinite 0.4s' }}
        filter="url(#sparkleFilter)"
      />
      <polygon 
        points="68,82 72,78 68,74 64,78" 
        fill="url(#diamondGlow)" 
        stroke="#ffffff" 
        strokeWidth="0.5" 
        style={{ animation: 'sparkle-twinkle 1.9s infinite 0.7s' }}
        filter="url(#sparkleFilter)"
      />
      <polygon 
        points="50,92 54,86 50,80 46,86" 
        fill="#ffffff" 
        stroke="#3b82f6" 
        strokeWidth="0.5" 
        style={{ animation: 'crystal-float 2.4s infinite 0.2s' }}
        filter="url(#sparkleFilter)"
      />
    </g>
    
    {/* Mega star clusters */}
    <g>
      <circle cx="22" cy="32" r="2" fill="#ffffff" style={{ animation: 'sparkle-twinkle 1.5s infinite' }} filter="url(#sparkleFilter)" />
      <circle cx="78" cy="32" r="2" fill="#ffffff" style={{ animation: 'sparkle-twinkle 1.7s infinite 0.2s' }} filter="url(#sparkleFilter)" />
      <circle cx="22" cy="68" r="2" fill="#ffffff" style={{ animation: 'sparkle-twinkle 1.6s infinite 0.4s' }} filter="url(#sparkleFilter)" />
      <circle cx="78" cy="68" r="2" fill="#ffffff" style={{ animation: 'sparkle-twinkle 1.8s infinite 0.6s' }} filter="url(#sparkleFilter)" />
      
      {/* Small stars */}
      <circle cx="30" cy="22" r="1" fill="#e0f2fe" style={{ animation: 'sparkle-twinkle 1.3s infinite 0.1s' }} />
      <circle cx="70" cy="22" r="1" fill="#e0f2fe" style={{ animation: 'sparkle-twinkle 1.4s infinite 0.3s' }} />
      <circle cx="30" cy="78" r="1" fill="#e0f2fe" style={{ animation: 'sparkle-twinkle 1.5s infinite 0.5s' }} />
      <circle cx="70" cy="78" r="1" fill="#e0f2fe" style={{ animation: 'sparkle-twinkle 1.6s infinite 0.7s' }} />
    </g>
    
    {/* Ultra micro sparkle dots */}
    <g>
      <circle cx="35" cy="25" r="0.8" fill="#ffffff" style={{ animation: 'particle-float 2s infinite', '--tx': '2px', '--ty': '-3px' }} />
      <circle cx="65" cy="25" r="0.8" fill="#ffffff" style={{ animation: 'particle-float 2.2s infinite 0.3s', '--tx': '-2px', '--ty': '-3px' }} />
      <circle cx="35" cy="75" r="0.8" fill="#ffffff" style={{ animation: 'particle-float 2.1s infinite 0.5s', '--tx': '2px', '--ty': '3px' }} />
      <circle cx="65" cy="75" r="0.8" fill="#ffffff" style={{ animation: 'particle-float 2.3s infinite 0.7s', '--tx': '-2px', '--ty': '3px' }} />
      
      <circle cx="25" cy="35" r="0.6" fill="#60a5fa" style={{ animation: 'particle-float 1.8s infinite 0.2s', '--tx': '1px', '--ty': '-2px' }} />
      <circle cx="75" cy="35" r="0.6" fill="#60a5fa" style={{ animation: 'particle-float 1.9s infinite 0.4s', '--tx': '-1px', '--ty': '-2px' }} />
      <circle cx="25" cy="65" r="0.6" fill="#60a5fa" style={{ animation: 'particle-float 2s infinite 0.6s', '--tx': '1px', '--ty': '2px' }} />
      <circle cx="75" cy="65" r="0.6" fill="#60a5fa" style={{ animation: 'particle-float 2.1s infinite 0.8s', '--tx': '-1px', '--ty': '2px' }} />
    </g>
    
    {/* Inner crystal rings */}
    <circle 
      cx="50" cy="50" r="28" 
      stroke="url(#crystalGradient)" 
      strokeWidth="0.8" 
      opacity="0.6" 
      style={{ animation: 'crystal-pulse 3.5s infinite 1.5s' }}
    />
    <circle 
      cx="50" cy="50" r="24" 
      stroke="#3b82f6" 
      strokeWidth="0.5" 
      opacity="0.4"
      style={{ animation: 'crystal-pulse 4s infinite 2s' }}
    />
    <circle 
      cx="50" cy="50" r="20" 
      stroke="#60a5fa" 
      strokeWidth="0.3" 
      opacity="0.3"
    />
    
    {/* Central core */}
    <circle 
      cx="50" cy="50" r="8" 
      fill="url(#superGlow)" 
      opacity="0.5" 
      style={{ animation: 'crystal-pulse 2s infinite 0.5s' }}
    />
    <circle 
      cx="50" cy="50" r="4" 
      fill="#ffffff" 
      opacity="0.8" 
      filter="url(#sparkleFilter)"
    />
  </svg>
);

export default FrameBlueCrystal;
