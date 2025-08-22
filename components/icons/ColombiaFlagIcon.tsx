
import React from 'react';

const ColombiaFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="30" height="20" fill="#FFCD00" />
    <rect y="10" width="30" height="5" fill="#003893" />
    <rect y="15" width="30" height="5" fill="#CE1126" />
  </svg>
);

export default ColombiaFlagIcon;
