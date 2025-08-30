import React from 'react';
const CastleGiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="10" y="50" width="80" height="40" fill="#B0C4DE" />
    <rect x="20" y="20" width="15" height="70" fill="#A9A9A9" />
    <rect x="65" y="20" width="15" height="70" fill="#A9A9A9" />
    <rect x="42.5" y="30" width="15" height="60" fill="#C0C0C0" />
    <path d="M 20 20 L 27.5 10 L 35 20 Z" fill="#808080" />
    <path d="M 65 20 L 72.5 10 L 80 20 Z" fill="#808080" />
    <path d="M 42.5 30 L 50 20 L 57.5 30 Z" fill="#696969" />
  </svg>
);
export default CastleGiftIcon;
