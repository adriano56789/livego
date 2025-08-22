import React from 'react';

const ChileFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="30" height="20" fill="#D52B1E" />
    <rect width="30" height="10" fill="#FFFFFF" />
    <rect width="10" height="10" fill="#0039A6" />
    <path d="M5 3.5l1.17 2.39.29-.59L7.6 7.5h-2.43l1.16-2.39z" fill="#FFFFFF" transform="translate(0, -0.5)"/>
  </svg>
);

export default ChileFlagIcon;
