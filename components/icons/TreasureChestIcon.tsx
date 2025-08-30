import React from 'react';
const TreasureChestIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <radialGradient id="glowGradient">
        <stop offset="0%" stopColor="#FFD700" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect x="10" y="40" width="80" height="50" rx="5" fill="#8B4513" />
    <rect x="10" y="40" width="80" height="10" fill="#DAA520" />
    <rect x="10" y="80" width="80" height="10" fill="#DAA520" />
    <rect x="45" y="60" width="10" height="10" fill="#696969" />
    <path d="M 10 40 Q 50 10, 90 40 Z" fill="#A0522D" />
    <path d="M 10 40 Q 50 20, 90 40 Z" fill="#DAA520" />
    <circle cx="50" cy="45" r="30" fill="url(#glowGradient)" />
  </svg>
);
export default TreasureChestIcon;
