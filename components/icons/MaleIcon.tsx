import React from 'react';

const MarsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z M13.5 6.75L18 2.25m0 0h-3.75m3.75 0v3.75" />
  </svg>
);

export default MarsIcon;