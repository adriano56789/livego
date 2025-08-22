import React from 'react';

const PeruFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="30" height="20" fill="#D91023" />
    <rect x="10" width="10" height="20" fill="#FFFFFF" />
  </svg>
);

export default PeruFlagIcon;
