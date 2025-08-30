import React from 'react';

const LovePotionIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    {/* Liquid */}
    <path d="M 50 85 L 15 50 C 15 30, 35 15, 50 35 C 65 15, 85 30, 85 50 Z" fill="#FFC0CB" />
    {/* Bottle */}
    <path d="M 50 88 L 12 53 C 12 28, 33 12, 50 33 C 67 12, 88 28, 88 53 Z" stroke="#E6E6FA" strokeWidth="4" fill="none" />
    {/* Neck and Cork */}
    <rect x="40" y="10" width="20" height="15" fill="#E6E6FA" />
    <rect x="38" y="5" width="24" height="8" rx="4" fill="#8B4513" />
    {/* Bubbles */}
    <circle cx="40" cy="60" r="4" fill="white" opacity="0.7" />
    <circle cx="60" cy="70" r="3" fill="white" opacity="0.7" />
    <circle cx="50" cy="50" r="5" fill="white" opacity="0.7" />
  </svg>
);

export default LovePotionIcon;