
import React from 'react';

export const RealisticRank3CrownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="bronzeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FDBA74" />
        <stop offset="25%" stopColor="#FFEDD5" />
        <stop offset="50%" stopColor="#FB923C" />
        <stop offset="75%" stopColor="#FFEDD5" />
        <stop offset="100%" stopColor="#C2410C" />
      </linearGradient>
      <linearGradient id="bronzeDarkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#C2410C" />
        <stop offset="100%" stopColor="#7C2D12" />
      </linearGradient>
      <radialGradient id="gemGreen" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#86EFAC" />
        <stop offset="100%" stopColor="#15803D" />
      </radialGradient>
      <filter id="crownBronzeDropShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.5)" />
      </filter>
    </defs>
    
    <g filter="url(#crownBronzeDropShadow)">
      {/* Base/Back */}
      <path d="M12 48 H52 V54 H12 Z" fill="url(#bronzeDarkGradient)" />
      <path d="M10 44 L12 48 H52 L54 44 L56 30 L44 38 L32 20 L20 38 L8 30 L10 44Z" fill="url(#bronzeGradient)" stroke="#7C2D12" strokeWidth="0.5" />
      
      {/* Detail Lines */}
      <path d="M12 48 H52" stroke="#7C2D12" strokeWidth="1" />
      
      {/* Jewels on tips */}
      <circle cx="8" cy="30" r="3" fill="url(#bronzeGradient)" stroke="#7C2D12" strokeWidth="0.5"/>
      <circle cx="20" cy="38" r="2.5" fill="url(#bronzeGradient)" stroke="#7C2D12" strokeWidth="0.5"/>
      <circle cx="32" cy="20" r="4" fill="url(#bronzeGradient)" stroke="#7C2D12" strokeWidth="0.5"/>
      <circle cx="44" cy="38" r="2.5" fill="url(#bronzeGradient)" stroke="#7C2D12" strokeWidth="0.5"/>
      <circle cx="56" cy="30" r="3" fill="url(#bronzeGradient)" stroke="#7C2D12" strokeWidth="0.5"/>

      {/* Center Gem (Emerald for Bronze) */}
      <path d="M32 36 L35 42 L32 46 L29 42 Z" fill="url(#gemGreen)" stroke="#14532D" strokeWidth="0.5" />
      
      {/* Lower Gems */}
      <circle cx="20" cy="51" r="1.5" fill="#60A5FA" />
      <circle cx="32" cy="51" r="2" fill="#15803D" />
      <circle cx="44" cy="51" r="1.5" fill="#60A5FA" />
    </g>
  </svg>
);
