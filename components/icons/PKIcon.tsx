import React from 'react';

export const PKIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" {...props}>
    <defs>
      <linearGradient id="pkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#ff00ff', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#00ffff', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="20" fill="url(#pkGradient)" />
    <text x="50" y="68" fontFamily="Arial, sans-serif" fontSize="60" fontWeight="bold" fill="white" textAnchor="middle">PK</text>
  </svg>
);