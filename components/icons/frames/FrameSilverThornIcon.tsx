import React from 'react';

export const FrameSilverThornIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
        <linearGradient id="gradSilverThorn" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e5e7eb"/>
            <stop offset="100%" stopColor="#9ca3af"/>
        </linearGradient>
    </defs>
    {/* Thorns Ring */}
    {[...Array(16)].map((_, i) => (
        <g key={i} transform={`rotate(${i * (360/16)} 50 50)`}>
            <path d="M50 10 L 53 15 L 50 20 L 47 15 Z" fill="url(#gradSilverThorn)" />
        </g>
    ))}
    <circle cx="50" cy="50" r="35" stroke="#9ca3af" strokeWidth="1" />
    {/* Flowers */}
    <g transform="translate(18 30)">
        <circle cx="0" cy="0" r="5" fill="#f472b6"/>
        <circle cx="0" cy="0" r="2" fill="#fbcfe8"/>
    </g>
    <g transform="translate(25 75)">
        <circle cx="0" cy="0" r="5" fill="#d8b4fe"/>
        <circle cx="0" cy="0" r="2" fill="#e9d5ff"/>
    </g>
    <g transform="translate(82 70)">
        <circle cx="0" cy="0" r="5" fill="#f472b6"/>
        <circle cx="0" cy="0" r="2" fill="#fbcfe8"/>
    </g>
     <g transform="translate(75 25)">
        <circle cx="0" cy="0" r="5" fill="#d8b4fe"/>
        <circle cx="0" cy="0" r="2" fill="#e9d5ff"/>
    </g>
  </svg>
);