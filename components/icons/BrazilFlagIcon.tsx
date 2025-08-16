import React from 'react';

const BrazilFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="20" cy="20" r="20" fill="#009B3A"/>
    <path d="M20 6L34.14 13V27L20 34L5.86 27V13L20 6Z" fill="#FFCC29"/>
    <circle cx="20" cy="20" r="8" fill="#002776"/>
  </svg>
);

export default BrazilFlagIcon;