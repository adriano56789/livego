
import React from 'react';

export const RealisticTop1CrownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="25%" stopColor="#FCD34D" />
        <stop offset="50%" stopColor="#FFFBEB" />
        <stop offset="75%" stopColor="#FCD34D" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      <linearGradient id="goldDarkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#92400E" />
      </linearGradient>
      <radialGradient id="gemRed" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FECACA" />
        <stop offset="100%" stopColor="#DC2626" />
      </radialGradient>
      <filter id="crownDropShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.5)" />
      </filter>
    </defs>
    
    <g filter="url(#crownDropShadow)">
      {/* Base/Back */}
      <path d="M12 48 H52 V54 H12 Z" fill="url(#goldDarkGradient)" />
      <path d="M10 44 L12 48 H52 L54 44 L56 30 L44 38 L32 20 L20 38 L8 30 L10 44Z" fill="url(#goldGradient)" stroke="#B45309" strokeWidth="0.5" />
      
      {/* Detail Lines */}
      <path d="M12 48 H52" stroke="#B45309" strokeWidth="1" />
      
      {/* Jewels on tips */}
      <circle cx="8" cy="30" r="3" fill="url(#goldGradient)" stroke="#B45309" strokeWidth="0.5"/>
      <circle cx="20" cy="38" r="2.5" fill="url(#goldGradient)" stroke="#B45309" strokeWidth="0.5"/>
      <circle cx="32" cy="20" r="4" fill="url(#goldGradient)" stroke="#B45309" strokeWidth="0.5"/>
      <circle cx="44" cy="38" r="2.5" fill="url(#goldGradient)" stroke="#B45309" strokeWidth="0.5"/>
      <circle cx="56" cy="30" r="3" fill="url(#goldGradient)" stroke="#B45309" strokeWidth="0.5"/>

      {/* Center Gem */}
      <path d="M32 36 L35 42 L32 46 L29 42 Z" fill="url(#gemRed)" stroke="#7F1D1D" strokeWidth="0.5" />
      
      {/* Lower Gems */}
      <circle cx="20" cy="51" r="1.5" fill="#3B82F6" />
      <circle cx="32" cy="51" r="2" fill="#EF4444" />
      <circle cx="44" cy="51" r="1.5" fill="#3B82F6" />
    </g>
  </svg>
);
