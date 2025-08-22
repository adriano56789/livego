
import React from 'react';

const PhilippinesFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="30" height="20" fill="#0038A8" />
    <rect y="10" width="30" height="10" fill="#CE1126" />
    <path d="M0 0L15 10L0 20V0Z" fill="white" />
  </svg>
);

export default PhilippinesFlagIcon;
