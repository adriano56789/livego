import React from 'react';

export const FrameDiamondIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="gradDiamond" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f9fafb" />
        <stop offset="100%" stopColor="#d1d5db" />
      </linearGradient>
      <filter id="diamondGlow">
        <feGaussianBlur stdDeviation="0.7" result="blur" />
        <feFlood floodColor="white" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#diamondGlow)">
      {[...Array(12)].map((_, i) => (
        <g key={i} transform={`rotate(${i * 30} 50 50)`}>
          <path d="M50 8 L 54 16 L 46 16 Z" fill="url(#gradDiamond)" />
        </g>
      ))}
       {[...Array(4)].map((_, i) => (
        <g key={i} transform={`rotate(${i * 90} 50 50)`}>
          <path d="M50 6 C 52 8, 54 10, 50 14 C 46 10, 48 8, 50 6" fill="white" />
        </g>
      ))}
      {[...Array(8)].map((_, i) => (
        <g key={i} transform={`rotate(${i * 45} 50 50)`}>
            <circle cx="50" cy="18" r="1.5" fill="#e5e7eb" />
        </g>
      ))}
    </g>
  </svg>
);