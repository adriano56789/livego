import React from 'react';

export const GlobeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.25 9.167h17.5M3.25 14.833h17.5M12 21a9.002 9.002 0 004.95-1.488A9 9 0 0012 3a9.002 9.002 0 00-4.95 1.488A9 9 0 0012 21z" />
    </svg>
);
