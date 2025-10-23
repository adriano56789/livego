import React from 'react';

export const FrameGoldenFloralIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="gradGoldFloral" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fef08a"/>
        <stop offset="50%" stopColor="#f59e0b"/>
        <stop offset="100%" stopColor="#fef08a"/>
      </linearGradient>
      <radialGradient id="gradOrangeFlower" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fb923c"/>
        <stop offset="100%" stopColor="#ea580c"/>
      </radialGradient>
      <filter id="goldSparkle">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" />
      </filter>
    </defs>
    {/* Base Ring */}
    <circle cx="50" cy="50" r="38" stroke="url(#gradGoldFloral)" strokeWidth="6"/>
    {/* Engravings */}
    {[...Array(24)].map((_, i) => (
         <path key={i} d="M50,10 L50,14" stroke="#ca8a04" strokeWidth="1" transform={`rotate(${i * 15} 50 50)`}/>
    ))}
    {/* Sparkles on ring */}
    <circle cx="30" cy="20" r="1.5" fill="white" filter="url(#goldSparkle)"/>
    <circle cx="70" cy="80" r="1.5" fill="white" filter="url(#goldSparkle)"/>
    <circle cx="80" cy="35" r="1.2" fill="white" filter="url(#goldSparkle)"/>
    <circle cx="18" cy="65" r="1" fill="white" filter="url(#goldSparkle)"/>
    {/* Flowers */}
    <g transform="translate(75 25) rotate(15)">
      <circle cx="0" cy="0" r="10" fill="url(#gradOrangeFlower)"/>
      <circle cx="0" cy="0" r="4" fill="#fed7aa"/>
      <path d="M-12 0 l 5 5 l -5 5" stroke="#166534" strokeWidth="2" strokeLinecap="round"/>
    </g>
    <g transform="translate(25 75) rotate(-30)">
      <circle cx="0" cy="0" r="10" fill="url(#gradOrangeFlower)"/>
      <circle cx="0" cy="0" r="4" fill="#fed7aa"/>
      <path d="M12 0 l -5 -5 l 5 -5" stroke="#166534" strokeWidth="2" strokeLinecap="round"/>
    </g>
  </svg>
);