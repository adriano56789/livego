import React from 'react';

export const GoldCoinWithGIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="12" cy="12" r="10" fill="#FBBF24"/>
    <circle cx="12" cy="12" r="8" fill="none" stroke="#FDE047" strokeWidth="1.5"/>
    <text x="12" y="16" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="white" textAnchor="middle">G</text>
  </svg>
);
