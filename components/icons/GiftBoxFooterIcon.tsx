
import React from 'react';

const GiftBoxFooterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="gift-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
      <linearGradient id="gift-red" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#DC2626" />
      </linearGradient>
    </defs>
    <rect x="15" y="45" width="70" height="45" rx="5" fill="url(#gift-red)" />
    <rect x="10" y="30" width="80" height="15" rx="5" fill="url(#gift-red)" />
    <rect x="42" y="30" width="16" height="60" fill="url(#gift-gold)" />
    <path d="M35 30 C 25 20, 40 10, 50 20 C 60 10, 75 20, 65 30 Z" fill="url(#gift-gold)" />
  </svg>
);

export default GiftBoxFooterIcon;
