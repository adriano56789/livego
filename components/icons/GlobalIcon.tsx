
import React from 'react';

const GlobalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="30" height="20" fill="#E5E7EB" />
    <g transform="translate(15, 10) scale(0.8)">
      <circle cx="0" cy="0" r="7" fill="white" stroke="#374151" strokeWidth="1.5" />
      <circle cx="0" cy="0" r="2" fill="#374151" />
      <path d="M0 -7 L0 7 M-7 0 L7 0" stroke="#374151" strokeWidth="1.5" />
    </g>
  </svg>
);

export default GlobalIcon;
