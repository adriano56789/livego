import React from 'react';
const DiamondHeartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M 50 90 L 10 50 C 10 30, 30 10, 50 30 C 70 10, 90 30, 90 50 Z" fill="#87CEEB" />
    <path d="M 50 90 L 50 30" stroke="white" strokeWidth="2" />
    <path d="M 10 50 L 50 30 L 90 50" stroke="white" strokeWidth="2" opacity="0.5" />
    <path d="M 30 40 L 50 60 L 70 40" stroke="white" strokeWidth="2" opacity="0.5" />
  </svg>
);
export default DiamondHeartIcon;
