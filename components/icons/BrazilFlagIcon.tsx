import React from 'react';

const BrazilFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="30" height="20" fill="#009B3A"/>
    <path d="M15 3L27 10L15 17L3 10L15 3Z" fill="#FFCC29"/>
    <circle cx="15" cy="10" r="4" fill="#002776"/>
  </svg>
);

export default BrazilFlagIcon;
