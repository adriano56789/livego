import React from 'react';
const DonutIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M 50,10 A 40,40 0 1 1 50,90 A 40,40 0 1 1 50,10 Z M 50,30 A 20,20 0 1 0 50,70 A 20,20 0 1 0 50,30 Z" fill="#D2691E" />
    <path d="M 50,10 A 40,40 0 0 1 90,50 C 90,50 90,30 70,20 C 50,10 50,10 50,10 Z" fill="#FFC0CB" />
    {/* Sprinkles */}
    <rect x="60" y="25" width="5" height="10" fill="#FF69B4" transform="rotate(20 62.5 30)" />
    <rect x="70" y="35" width="5" height="10" fill="#87CEEB" transform="rotate(45 72.5 40)" />
    <rect x="50" y="18" width="5" height="10" fill="#98FB98" transform="rotate(-10 52.5 23)" />
  </svg>
);
export default DonutIcon;
