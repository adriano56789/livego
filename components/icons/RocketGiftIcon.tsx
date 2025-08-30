import React from 'react';
const RocketGiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M 50 10 L 70 50 L 60 55 L 60 80 L 40 80 L 40 55 L 30 50 Z" fill="#C0C0C0" />
    <path d="M 50 10 L 60 30 L 40 30 Z" fill="#FF4500" />
    <circle cx="50" cy="65" r="10" fill="#4682B4" />
    <path d="M 40 80 L 30 90 L 40 85 Z" fill="#FF4500" />
    <path d="M 60 80 L 70 90 L 60 85 Z" fill="#FF4500" />
  </svg>
);
export default RocketGiftIcon;
