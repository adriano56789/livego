import React from 'react';
const CrownV2Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M 10 80 L 90 80 L 90 60 L 70 40 L 50 60 L 30 40 L 10 60 Z" fill="#FFD700" />
    <path d="M 10 80 L 90 80 L 85 70 L 15 70 Z" fill="#F0E68C" />
    <circle cx="20" cy="35" r="8" fill="#FF4136" />
    <circle cx="50" cy="30" r="8" fill="#0074D9" />
    <circle cx="80" cy="35" r="8" fill="#2ECC40" />
  </svg>
);
export default CrownV2Icon;
