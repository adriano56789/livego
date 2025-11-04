import React from 'react';

export const PixIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <rect width="40" height="40" rx="8" fill="#32BCAD"/>
        <text x="20" y="29" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="bold" fill="white" textAnchor="middle">P</text>
    </svg>
);
