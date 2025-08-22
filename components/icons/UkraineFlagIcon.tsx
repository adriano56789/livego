import React from 'react';

const UkraineFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="30" height="20" fill="#005BBB" />
    <rect y="10" width="30" height="10" fill="#FFD500" />
  </svg>
);

export default UkraineFlagIcon;
