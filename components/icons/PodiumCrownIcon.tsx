import React from 'react';

const PodiumCrownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M13 43L7 22L15 28L24 14L33 28L41 22L35 43H13Z" fill="url(#paint0_linear_crown)" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="7" cy="21" r="2" fill="#FFD700"/>
    <circle cx="24" cy="13" r="2" fill="#FFD700"/>
    <circle cx="41" cy="21" r="2" fill="#FFD700"/>
    <path d="M4 5H44" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round"/>
    <defs>
      <linearGradient id="paint0_linear_crown" x1="24" y1="14" x2="24" y2="43" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FBBF24"/>
        <stop offset="1" stopColor="#F59E0B"/>
      </linearGradient>
    </defs>
  </svg>
);

export default PodiumCrownIcon;