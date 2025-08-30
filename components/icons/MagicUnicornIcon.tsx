import React from 'react';

const MagicUnicornIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="unicornHorn" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffff00" />
        <stop offset="100%" stopColor="#ff8c00" />
      </linearGradient>
    </defs>
    {/* Head */}
    <path d="M 30 80 C 10 60, 20 20, 50 20 C 80 20, 90 40, 70 70 C 60 85, 40 90, 30 80 Z" fill="white" />
    {/* Horn */}
    <path d="M 45 20 L 50 0 L 55 20 Z" fill="url(#unicornHorn)" />
    {/* Eye */}
    <circle cx="60" cy="40" r="5" fill="black" />
    {/* Mane */}
    <path d="M 40 25 C 20 30, 20 50, 35 60" fill="#ffc0cb" />
  </svg>
);

export default MagicUnicornIcon;