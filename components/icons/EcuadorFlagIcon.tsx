import React from 'react';

const EcuadorFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="30" height="20" fill="#FFDD00" />
    <rect y="10" width="30" height="5" fill="#0057B7" />
    <rect y="15" width="30" height="5" fill="#D62612" />
  </svg>
);

export default EcuadorFlagIcon;
