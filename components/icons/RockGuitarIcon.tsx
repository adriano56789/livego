import React from 'react';

const RockGuitarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g transform="rotate(30 50 50)">
      {/* Body */}
      <path d="M 50 90 C 30 90, 20 70, 30 50 L 70 50 C 80 70, 70 90, 50 90 Z" fill="#D2691E" />
      {/* Neck */}
      <rect x="45" y="10" width="10" height="50" fill="#8B4513" />
      {/* Headstock */}
      <path d="M 40 10 L 60 10 L 55 0 L 45 0 Z" fill="#333" />
      {/* Sound hole */}
      <circle cx="50" cy="65" r="10" fill="black" />
    </g>
  </svg>
);

export default RockGuitarIcon;