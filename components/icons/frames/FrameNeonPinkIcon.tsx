import React from 'react';

export const FrameNeonPinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <filter id="neonPinkGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#neonPinkGlow)">
      <circle cx="50" cy="50" r="40" stroke="#f472b6" strokeWidth="4"/>
      <circle cx="50" cy="50" r="37" stroke="#ec4899" strokeWidth="1"/>
      {[...Array(24)].map((_, i) => (
        <g key={i} transform={`rotate(${i * 15} 50 50)`}>
            <path d="M 50 12 A 5 5 0 0 1 50 18" stroke="#f9a8d4" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
        </g>
      ))}
    </g>
  </svg>
);