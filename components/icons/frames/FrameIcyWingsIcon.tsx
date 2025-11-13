import React from 'react';
export const FrameIcyWingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="gradIcyBlue" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#a5f3fc"/>
        <stop offset="100%" stopColor="#38bdf8"/>
      </linearGradient>
      <linearGradient id="gradIcyDark" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3730a3"/>
        <stop offset="100%" stopColor="#1e1b4b"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="38" stroke="url(#gradIcyDark)" strokeWidth="3"/>
    {/* Wings/Flames */}
    <g transform="translate(50, 88)">
      <path d="M0,0 C -20,-10 -30,-30 -25,-50" stroke="url(#gradIcyBlue)" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M0,0 C 20,-10 30,-30 25,-50" stroke="url(#gradIcyBlue)" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M-5,-2 C -22,-12 -32,-32 -27,-52" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.8"/>
      <path d="M5,-2 C 22,-12 32,-32 27,-52" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.8"/>
    </g>
    {/* Diamonds */}
    <path d="M50 8 L 58 18 L 50 22 L 42 18 Z" fill="url(#gradIcyBlue)" />
    <path d="M50 92 L 55 85 L 50 82 L 45 85 Z" fill="url(#gradIcyBlue)" />
  </svg>
);