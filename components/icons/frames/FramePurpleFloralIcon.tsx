import React from 'react';

export const FramePurpleFloralIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="gradPurpleGlow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#a855f7"/>
        <stop offset="100%" stopColor="#d946ef"/>
      </linearGradient>
      <radialGradient id="gradBlueFlower" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#93c5fd"/>
        <stop offset="100%" stopColor="#3b82f6"/>
      </radialGradient>
      <radialGradient id="gradPurpleFlowerCenter" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#d8b4fe"/>
        <stop offset="100%" stopColor="#a855f7"/>
      </radialGradient>
      <filter id="purpleBloom">
        <feGaussianBlur stdDeviation="2.5" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#purpleBloom)">
        <circle cx="50" cy="50" r="38" stroke="url(#gradPurpleGlow)" strokeWidth="5"/>
    </g>
    {/* Flower Cluster */}
    <g transform="translate(0, 55)">
        <circle cx="35" cy="30" r="7" fill="url(#gradBlueFlower)"/>
        <circle cx="35" cy="30" r="3" fill="#dbeafe"/>
        <circle cx="50" cy="40" r="8" fill="url(#gradPurpleFlowerCenter)"/>
        <circle cx="50" cy="40" r="3.5" fill="#f3e8ff"/>
        <circle cx="65" cy="30" r="7" fill="url(#gradBlueFlower)"/>
        <circle cx="65" cy="30" r="3" fill="#dbeafe"/>
        <path d="M40 35 l 10 8 l 10 -8" stroke="#15803d" strokeWidth="2" strokeLinecap="round"/>
    </g>
  </svg>
);