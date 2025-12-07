import React from 'react';

export const SimpleDiamondIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className="w-6 h-6" 
    {...props}
  >
    <path d="M12 2L2 12l10 10 10-10L12 2z" />
  </svg>
);
