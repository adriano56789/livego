import React from 'react';
const RingGiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="60" r="30" stroke="#FFD700" strokeWidth="8" fill="none" />
    <path d="M 50 30 L 40 10 L 60 10 Z" fill="#87CEEB" />
    <path d="M 50 30 L 45 20 L 55 20 Z" fill="white" />
  </svg>
);
export default RingGiftIcon;
