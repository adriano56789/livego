import React from 'react';

export const FrameOrnateBronzeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="gradBronze" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f59e0b"/>
        <stop offset="50%" stopColor="#92400e"/>
        <stop offset="100%" stopColor="#f59e0b"/>
      </linearGradient>
      <linearGradient id="gradDiamondWhite" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#e0f2fe"/>
        <stop offset="100%" stopColor="#7dd3fc"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="40" stroke="url(#gradBronze)" strokeWidth="6" />
    <circle cx="50" cy="50" r="34" stroke="#92400e" strokeWidth="1" />
    {[...Array(24)].map((_, i) => (
      <circle key={i} cx="50" cy="19" r="2" fill="#f59e0b" transform={`rotate(${i * 15} 50 50)`} />
    ))}
    {/* Top Diamond */}
    <path d="M50 8 L 60 20 L 50 25 L 40 20 Z" fill="url(#gradDiamondWhite)" />
    <path d="M50 8 L 40 20 L 50 25 Z" fill="white" opacity="0.7" />
    {/* Bottom Diamond */}
    <g transform="rotate(180 50 50)">
      <path d="M50 12 L 56 20 L 50 23 L 44 20 Z" fill="url(#gradDiamondWhite)" />
    </g>
  </svg>
);