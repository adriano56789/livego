import React from 'react';

const BoliviaFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="30" height="20" fill="#d52b1e" />
    <rect y="6.67" width="30" height="6.66" fill="#f9e300" />
    <rect y="13.33" width="30" height="6.67" fill="#007934" />
  </svg>
);

export default BoliviaFlagIcon;
