import React from 'react';

const RomaniaFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="30" height="20" fill="#002B7F" />
    <rect x="10" width="20" height="20" fill="#FCD116" />
    <rect x="20" width="10" height="20" fill="#CE1126" />
  </svg>
);

export default RomaniaFlagIcon;
