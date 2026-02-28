
import React from 'react';

export const BrazilFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="20" height="20" viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg" {...props}>
        <rect width="100" height="70" fill="#009c3b"/>
        <path d="M50 5L95 35 50 65 5 35z" fill="#ffdf00"/>
        <circle cx="50" cy="35" r="17.5" fill="#002776"/>
    </svg>
);
