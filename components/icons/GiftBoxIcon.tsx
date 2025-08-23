import React from 'react';

const GiftBoxIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" {...props}>
    <circle cx="50" cy="50" r="50" fill="black"/>
    <g fill="white">
      <rect x="25" y="50" width="50" height="25"/>
      <rect x="30" y="40" width="40" height="10"/>
      <path d="M 46 40 C 46 30, 35 30, 35 40 C 35 50, 46 45, 46 40 Z"/>
      <path d="M 54 40 C 54 30, 65 30, 65 40 C 65 50, 54 45, 54 40 Z"/>
    </g>
    <g fill="black">
      <rect x="46" y="40" width="8" height="35"/>
      <rect x="25" y="52" width="50" height="6"/>
    </g>
  </svg>
);

export default GiftBoxIcon;
