
import React from 'react';

const BuzzCastIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="12" cy="12" r="10" fill="url(#grad)" />
    <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">
      L
    </text>
    <defs>
      <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#6D28D9" />
      </linearGradient>
    </defs>
  </svg>
);

export default BuzzCastIcon;