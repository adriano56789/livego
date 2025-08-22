import React from 'react';

const KenyaFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="30" height="20" fill="black" />
    <rect y="7" width="30" height="6" fill="#BB0000" />
    <rect y="8.5" width="30" height="3" fill="#FFFFFF" />
    <rect y="14" width="30" height="6" fill="#008D3D" />
  </svg>
);

export default KenyaFlagIcon;
