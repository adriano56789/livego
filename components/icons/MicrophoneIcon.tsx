import React from 'react';
const MicrophoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="48" y="70" width="4" height="20" fill="#B0C4DE" />
    <rect x="40" y="90" width="20" height="5" rx="2.5" fill="#B0C4DE" />
    <rect x="30" y="60" width="40" height="10" fill="#B0C4DE" />
    <rect x="35" y="15" width="30" height="50" rx="15" fill="#C0C0C0" />
    <rect x="35" y="15" width="30" height="40" rx="15" fill="#D3D3D3" />
    <line x1="40" y1="25" x2="60" y2="25" stroke="#A9A9A9" strokeWidth="3" />
    <line x1="40" y1="35" x2="60" y2="35" stroke="#A9A9A9" strokeWidth="3" />
    <line x1="40" y1="45" x2="60" y2="45" stroke="#A9A9A9" strokeWidth="3" />
  </svg>
);
export default MicrophoneIcon;
