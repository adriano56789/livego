
import React from 'react';

const ProtectIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="protectHeartGradient" x1="12" y1="4.25" x2="12" y2="17.27" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F9A8D4"/>
        <stop offset="1" stopColor="#EC4899"/>
      </linearGradient>
    </defs>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="url(#protectHeartGradient)" />
  </svg>
);

export default ProtectIcon;
