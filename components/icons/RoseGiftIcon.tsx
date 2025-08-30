import React from 'react';
const RoseGiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M 50 90 L 45 60 L 55 60 Z" fill="#228B22" />
    <path d="M 50 60 C 40 50, 40 40, 50 30 C 60 40, 60 50, 50 60 Z" fill="#FF6347" />
    <path d="M 50 30 C 40 20, 60 20, 50 30" fill="#DC143C" />
    <path d="M 45 45 C 35 35, 35 25, 45 25 C 55 25, 55 35, 45 45 Z" fill="#FF4500" />
    <path d="M 55 45 C 65 35, 65 25, 55 25 C 45 25, 45 35, 55 45 Z" fill="#FF4500" />
  </svg>
);
export default RoseGiftIcon;
