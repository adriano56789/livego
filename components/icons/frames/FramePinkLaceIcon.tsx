import React from 'react';
export const FramePinkLaceIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="gradPinkLace" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f9a8d4" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
      <linearGradient id="gradDiamondLace" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f0f9ff"/>
        <stop offset="100%" stopColor="#bae6fd"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="38" stroke="url(#gradPinkLace)" strokeWidth="3"/>
    {[...Array(16)].map((_, i) => (
      <path key={i} d="M50,10 C 55,15 45,15 50,20" stroke="#be185d" strokeWidth="1" transform={`rotate(${i * (360/16)} 50 50)`} />
    ))}
    {/* Diamonds */}
    <g transform="translate(50 12) scale(0.8)">
      <path d="M0 -8 L 6 0 L 0 4 L -6 0 Z" fill="url(#gradDiamondLace)" />
    </g>
    <g transform="translate(18 50) scale(0.8) rotate(90)">
      <path d="M0 -8 L 6 0 L 0 4 L -6 0 Z" fill="url(#gradDiamondLace)" />
    </g>
     <g transform="translate(82 50) scale(0.8) rotate(-90)">
      <path d="M0 -8 L 6 0 L 0 4 L -6 0 Z" fill="url(#gradDiamondLace)" />
    </g>
  </svg>
);