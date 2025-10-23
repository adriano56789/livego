import React from 'react';

export const FrameFloralWreathIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="gradFloralWood" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#6b462a"/>
        <stop offset="100%" stopColor="#422006"/>
      </linearGradient>
      <radialGradient id="gradPinkFlower" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fbcfe8"/>
        <stop offset="100%" stopColor="#f472b6"/>
      </radialGradient>
      <radialGradient id="gradPurpleFlower" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#e9d5ff"/>
        <stop offset="100%" stopColor="#c084fc"/>
      </radialGradient>
    </defs>
    <path d="M 85,50 A 35,35 0 1 1 15,50 A 35,35 0 1 1 85,50 Z" stroke="url(#gradFloralWood)" strokeWidth="3" />
    <path d="M 83,74 L 88,78 L 92,70" stroke="#a16207" strokeWidth="1" />
    
    {/* Flowers & Leaves */}
    <g>
        {/* Top Heart */}
        <path d="M50 12 C 55 12, 55 18, 50 22 C 45 18, 45 12, 50 12 Z" fill="#ec4899"/>
        <circle cx="50" cy="11" r="1" fill="#f9a8d4"/>

        {/* Left Side */}
        <circle cx="23" cy="28" r="5" fill="url(#gradPurpleFlower)"/>
        <path d="M18,40 l 10,-5 l -5,10 z" fill="#166534" />
        <circle cx="15" cy="52" r="6" fill="url(#gradPinkFlower)"/>
        <path d="M22,65 l 8,-2 l -2,8 z" fill="#15803d" />
        <circle cx="30" cy="77" r="5" fill="url(#gradPurpleFlower)"/>
        <path d="M40,85 l 5,-8 l 8,5 z" fill="#166534" />
        
        {/* Right Side */}
        <circle cx="77" cy="28" r="5" fill="url(#gradPinkFlower)"/>
        <path d="M82,40 l -10,-5 l 5,10 z" fill="#166534" />
        <circle cx="85" cy="52" r="6" fill="url(#gradPurpleFlower)"/>
        <path d="M78,65 l -8,-2 l 2,8 z" fill="#15803d" />
        <circle cx="70" cy="77" r="5" fill="url(#gradPinkFlower)"/>
        <path d="M60,85 l -5,-8 l -8,5 z" fill="#166534" />
    </g>
  </svg>
);