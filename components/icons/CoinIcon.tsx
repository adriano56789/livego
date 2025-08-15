
import React from 'react';

const CoinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="12" cy="12" r="9" fill="#FBBF24"/>
    <circle cx="12" cy="12" r="4" fill="#F87171"/>
  </svg>
);

export default CoinIcon;
