import React from 'react';

const FunnyBombIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    {/* Fuse */}
    <path d="M 70 20 Q 80 10, 85 25" stroke="orange" strokeWidth="4" fill="none" />
    <path d="M 83 22 L 87 28" stroke="red" strokeWidth="2" />
    {/* Bomb Body */}
    <circle cx="50" cy="60" r="30" fill="#333" />
    <circle cx="55" cy="55" r="8" fill="white" opacity="0.5" />
  </svg>
);

export default FunnyBombIcon;