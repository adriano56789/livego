
import React from 'react';

const KissIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10" />
        <path d="M10 14l2-2 2 2" />
        <path d="M15.5 9.5a1.5 1.5 0 0 0-3 0" />
        <path d="M8 9h.01" />
        <path d="M19.5 8.5c-1 1.5-3 1.5-3 0 0-1.5 2-1.5 3 0z" />
    </svg>
);

export default KissIcon;
