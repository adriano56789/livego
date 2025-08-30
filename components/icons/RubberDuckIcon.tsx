import React from 'react';
const RubberDuckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M 20 60 C 20 50, 30 50, 40 55 C 50 60, 60 70, 75 70 C 90 70, 95 60, 95 55 C 95 45, 85 40, 75 35 C 65 30, 60 20, 70 15 C 75 12, 80 15, 80 20 C 80 25, 75 25, 70 22" fill="#FFD700" />
    <circle cx="72" cy="28" r="4" fill="black" />
    <path d="M 80 35 C 85 35, 88 38, 85 42 C 82 46, 78 43, 80 35" fill="#FFA500" />
  </svg>
);
export default RubberDuckIcon;
