import React from 'react';

const SpaceshipIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    {/* Saucer */}
    <ellipse cx="50" cy="50" rx="40" ry="15" fill="silver" />
    {/* Dome */}
    <path d="M 35 50 A 15 15 0 0 1 65 50 Z" fill="lightblue" />
    {/* Lights */}
    <circle cx="30" cy="50" r="4" fill="yellow" />
    <circle cx="50" cy="50" r="4" fill="red" />
    <circle cx="70" cy="50" r="4" fill="green" />
  </svg>
);

export default SpaceshipIcon;