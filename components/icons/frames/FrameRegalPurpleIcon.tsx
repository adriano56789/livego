import React from 'react';
export const FrameRegalPurpleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="gradRegalPurple" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#e9d5ff" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="40" stroke="url(#gradRegalPurple)" strokeWidth="2" />
    {[...Array(4)].map((_, i) => (
      <g key={i} transform={`rotate(${i * 90} 50 50)`}>
        <path d="M50 4 L 58 16 L 50 20 L 42 16 Z" fill="#d8b4fe" />
        <path d="M50,10 C 60,25 40,25 50,40" stroke="#c084fc" strokeWidth="1.5" fill="none" />
        <path d="M50,10 C 62,20 38,20 50,10" stroke="#a855f7" strokeWidth="1" fill="none" />
      </g>
    ))}
  </svg>
);