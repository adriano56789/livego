import React from 'react';

const UsaFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <clipPath id="circle-clip-us">
        <circle cx="20" cy="20" r="20" />
      </clipPath>
    </defs>
    <g clipPath="url(#circle-clip-us)">
      <rect width="40" height="40" fill="#B22234" />
      <path d="M0,3 H40 M0,9 H40 M0,15 H40 M0,21 H40 M0,27 H40 M0,33 H40 M0,39 H40" stroke="#FFFFFF" strokeWidth="3" />
      <rect width="20" height="21" fill="#3C3B6E" />
      <circle cx="5" cy="5" r="1.2" fill="white" />
      <circle cx="10" cy="5" r="1.2" fill="white" />
      <circle cx="15" cy="5" r="1.2" fill="white" />
      <circle cx="7.5" cy="10.5" r="1.2" fill="white" />
      <circle cx="12.5" cy="10.5" r="1.2" fill="white" />
      <circle cx="5" cy="16" r="1.2" fill="white" />
      <circle cx="10" cy="16" r="1.2" fill="white" />
      <circle cx="15" cy="16" r="1.2" fill="white" />
    </g>
  </svg>
);

export default UsaFlagIcon;
