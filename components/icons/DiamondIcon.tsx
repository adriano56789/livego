import React from 'react';

export const DiamondIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L6 8l6 14 6-14L12 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22v-8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l6 6 6-6" />
    </svg>
);
