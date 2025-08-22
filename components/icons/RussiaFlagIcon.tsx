
import React from 'react';

const RussiaFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="30" height="20" fill="white" />
    <rect y="6.67" width="30" height="6.66" fill="#0039A6" />
    <rect y="13.33" width="30" height="6.67" fill="#D52B1E" />
  </svg>
);

export default RussiaFlagIcon;
