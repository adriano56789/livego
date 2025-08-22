
import React from 'react';

const CanadaFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="30" height="20" fill="white" />
    <rect width="7.5" height="20" fill="#FF0000" />
    <rect x="22.5" width="7.5" height="20" fill="#FF0000" />
    <path d="M15 6.5l-2.5 3h-2l3-4-2-3h2.5l1-3 1 3h2.5l-2 3 3 4h-2l-2.5-3-1.5 2v4h-1v-4z" fill="#FF0000" />
  </svg>
);

export default CanadaFlagIcon;
