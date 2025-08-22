
import React from 'react';

const IndiaFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="30" height="20" fill="#FF9933" />
    <rect y="6.67" width="30" height="6.66" fill="white" />
    <rect y="13.33" width="30" height="6.67" fill="#138808" />
    <circle cx="15" cy="10" r="2.5" fill="none" stroke="#000080" strokeWidth="1" />
  </svg>
);

export default IndiaFlagIcon;
