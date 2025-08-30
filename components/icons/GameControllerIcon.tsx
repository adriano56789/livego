import React from 'react';
const GameControllerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M 10 50 C 10 30, 30 30, 40 35 L 60 35 C 70 30, 90 30, 90 50 C 90 70, 70 70, 60 65 L 40 65 C 30 70, 10 70, 10 50 Z" fill="#333" />
    <rect x="25" y="48" width="15" height="4" rx="2" fill="#555" />
    <rect x="30" y="43" width="5" height="14" rx="2.5" fill="#555" />
    <circle cx="75" cy="45" r="5" fill="#FF4136" />
    <circle cx="65" cy="55" r="5" fill="#0074D9" />
  </svg>
);
export default GameControllerIcon;
