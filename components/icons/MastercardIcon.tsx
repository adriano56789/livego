import React from 'react';

const MastercardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" {...props}>
    <g>
      <circle fill="#EB001B" cx="18" cy="24" r="14"/>
      <circle fill="#F79E1B" cx="30" cy="24" r="14"/>
      <path fill="#FF5F00" d="M24 11.351 A 14 14 0 0 1 24 36.649 A 14 14 0 0 1 24 11.351 Z" />
    </g>
  </svg>
);

export default MastercardIcon;
