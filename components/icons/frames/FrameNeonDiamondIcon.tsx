import React from 'react';

export const FrameNeonDiamondIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="gradNeonDiamond" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#a78bfa" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
      <linearGradient id="gradDiamondBlue" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#a5f3fc"/>
        <stop offset="100%" stopColor="#38bdf8"/>
      </linearGradient>
      <filter id="neonDiamondGlow">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feFlood floodColor="#c4b5fd" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#neonDiamondGlow)">
      <circle cx="50" cy="50" r="38" stroke="url(#gradNeonDiamond)" strokeWidth="3"/>
      <path d="M42 50 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0" stroke="#a78bfa" strokeWidth="1" opacity="0.5"/>
      {/* Top Diamond */}
      <path d="M50 8 L 60 20 L 50 24 L 40 20 Z" fill="url(#gradDiamondBlue)" />
      <path d="M50 8 L 40 20 L 50 24" fill="#e0f2fe" opacity="0.7" />
       {/* Side Diamonds */}
      <g transform="rotate(90 50 50)">
         <path d="M50 12 L 57 20 L 50 22 L 43 20 Z" fill="url(#gradDiamondBlue)" />
      </g>
      <g transform="rotate(-90 50 50)">
         <path d="M50 12 L 57 20 L 50 22 L 43 20 Z" fill="url(#gradDiamondBlue)" />
      </g>
       {/* Bottom diamond smaller */}
      <path d="M50 92 L 55 85 L 50 83 L 45 85 Z" fill="url(#gradDiamondBlue)" />
    </g>
  </svg>
);