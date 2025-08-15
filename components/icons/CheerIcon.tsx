
import React from 'react';

const CheerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 4.931 3.56 9.017 8.125 9.833" />
        <path d="M12 8l8 4-8 4" />
    </svg>
);

export default CheerIcon;
