
import React from 'react';

const ClarityIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75L8.25 8.25" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75L8.25 12" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12L12 8.25" />
    </svg>
);

export default ClarityIcon;
