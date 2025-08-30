import React from 'react';
const HeartGiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="heartGiftGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8A80" />
        <stop offset="100%" stopColor="#FF5252" />
      </linearGradient>
    </defs>
    <path d="M 50 90 L 10 50 C 10 30, 30 10, 50 30 C 70 10, 90 30, 90 50 Z" fill="url(#heartGiftGradient)" />
  </svg>
);
export default HeartGiftIcon;
