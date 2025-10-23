import React from 'react';

export const FramePinkGemIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <radialGradient id="gradPinkGem" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fbcfe8"/>
        <stop offset="100%" stopColor="#ec4899"/>
      </radialGradient>
      <filter id="pinkGemGlow">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feFlood floodColor="#f472b6" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#pinkGemGlow)">
      {[...Array(20)].map((_, i) => (
        <g key={i} transform={`rotate(${(360 / 20) * i} 50 50)`}>
          <path d="M50 8 C 55 12, 55 18, 50 22 C 45 18, 45 12, 50 8 Z" fill="url(#gradPinkGem)" />
        </g>
      ))}
    </g>
  </svg>
);