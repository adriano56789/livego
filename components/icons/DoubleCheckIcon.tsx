import React from 'react';

const DoubleCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 12.75l6 6 9-13.5" className="opacity-60" />
  </svg>
);

export default DoubleCheckIcon;