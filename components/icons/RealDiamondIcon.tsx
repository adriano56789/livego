import React from 'react';

export const RealDiamondIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path 
      d="M12 2L2 12L12 22L22 12L12 2Z" 
      fill="#FFD700" 
      stroke="#FFA500" 
      strokeWidth="1.5"
    />
  </svg>
);
