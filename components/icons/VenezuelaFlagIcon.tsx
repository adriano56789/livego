import React from 'react';

const VenezuelaFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="30" height="20" fill="#FFCE00" />
    <rect y="6.67" width="30" height="6.66" fill="#00247D" />
    <rect y="13.33" width="30" height="6.67" fill="#CE1126" />
  </svg>
);

export default VenezuelaFlagIcon;
