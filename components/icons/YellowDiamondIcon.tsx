import React from 'react';

export const YellowDiamondIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M6 4L2 9L12 21L22 9L18 4H6Z" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M2 9H22" stroke="#B45309" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M12 21L7 9" stroke="#B45309" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M12 21L17 9" stroke="#B45309" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M6 4L12 9L18 4" stroke="#B45309" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);