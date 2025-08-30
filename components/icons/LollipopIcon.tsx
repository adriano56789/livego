import React from 'react';
const LollipopIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <radialGradient id="lollipopGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" stopColor="#ff8a80" />
        <stop offset="25%" stopColor="#ff8a80" />
        <stop offset="25%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#80d8ff" />
        <stop offset="75%" stopColor="#80d8ff" />
        <stop offset="75%" stopColor="#ffff8d" />
        <stop offset="100%" stopColor="#ffff8d" />
      </radialGradient>
    </defs>
    <rect x="47" y="65" width="6" height="35" fill="#f5f5f5" rx="3" />
    <g transform="rotate(45 50 50)">
      <circle cx="50" cy="50" r="30" fill="url(#lollipopGradient)" />
    </g>
  </svg>
);
export default LollipopIcon;
