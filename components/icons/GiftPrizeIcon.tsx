import React from 'react';

const GiftPrizeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M4 10H20" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 10V21" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round"/>
    <path d="M5 12V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V12H5Z" fill="#DC2626"/>
    <path d="M5 12V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V12" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 12H19V8H5V12Z" fill="#DC2626" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 8C9 5.79086 10.3431 4 12 4C13.6569 4 15 5.79086 15 8" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export default GiftPrizeIcon;
