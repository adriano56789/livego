import React from 'react';

export const BattleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 21L3 17.25V3h14.25L21 6.75V21H6.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 21V3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17.25h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6.75h18" />
    </svg>
);
