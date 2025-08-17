import React from 'react';

const SwedenFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <clipPath id="circle-clip-se">
        <circle cx="20" cy="20" r="20" />
      </clipPath>
    </defs>
    <g clipPath="url(#circle-clip-se)">
      <rect width="40" height="40" fill="#006AA7" />
      <rect x="13" width="6" height="40" fill="#FFCD00" />
      <rect y="17" width="40" height="6" fill="#FFCD00" />
    </g>
  </svg>
);

export default SwedenFlagIcon;
