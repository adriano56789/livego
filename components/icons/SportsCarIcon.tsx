import React from 'react';
const SportsCarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M 10 70 L 15 70 L 20 60 L 80 60 L 85 70 L 90 70 L 85 50 L 75 40 L 35 40 L 25 50 Z" fill="#E53935" />
    <path d="M 30 55 L 45 42 L 65 42 L 70 55 Z" fill="#FFF" opacity="0.5" />
    <circle cx="25" cy="70" r="10" fill="#222" />
    <circle cx="75" cy="70" r="10" fill="#222" />
    <circle cx="25" cy="70" r="5" fill="#DDD" />
    <circle cx="75" cy="70" r="5" fill="#DDD" />
  </svg>
);
export default SportsCarIcon;
