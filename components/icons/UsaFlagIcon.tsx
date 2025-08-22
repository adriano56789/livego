import React from 'react';

const UsaFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="30" height="20" fill="#B22234" />
      <path d="M0,2 H30 M0,5 H30 M0,8 H30 M0,11 H30 M0,14 H30 M0,17 H30" stroke="#FFFFFF" strokeWidth="2" />
      <rect width="14" height="10" fill="#3C3B6E" />
  </svg>
);

export default UsaFlagIcon;
