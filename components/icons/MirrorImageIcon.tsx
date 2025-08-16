
import React from 'react';

const MirrorImageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.375V5.625" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 01-9-9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 00-9-9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18" />
  </svg>
);

export default MirrorImageIcon;
