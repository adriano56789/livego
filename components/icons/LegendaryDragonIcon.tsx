import React from 'react';

const LegendaryDragonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g transform="scale(0.9) translate(5, 5)">
      {/* Head */}
      <path d="M 60 20 C 80 10, 90 30, 80 50 C 70 70, 40 80, 30 60 C 20 40, 40 10, 60 20 Z" fill="darkgreen" />
      {/* Eye */}
      <circle cx="75" cy="35" r="5" fill="red" />
      {/* Horns */}
      <path d="M 60 20 L 50 5 L 55 20 Z" fill="gold" />
      <path d="M 70 25 L 60 10 L 65 25 Z" fill="gold" />
      {/* Smoke */}
      <path d="M 30 60 C 20 55, 10 65, 20 70 C 15 75, 25 80, 20 85" stroke="gray" strokeWidth="3" fill="none" />
    </g>
  </svg>
);

export default LegendaryDragonIcon;