import React from 'react';

export const YellowDiamondIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12 2L2.5 8L12 22L21.5 8L12 2Z" fill="url(#paint0_linear_yellow_diamond)" stroke="#D97706" strokeWidth="0.5"/>
        <path d="M2.5 8H21.5" stroke="#D97706" strokeWidth="0.5"/>
        <path d="M7.5 8L12 15.5L16.5 8" stroke="#D97706" strokeWidth="0.5"/>
        <path d="M12 2V8" stroke="#D97706" strokeWidth="0.5"/>
        <path d="M12 22V15.5" stroke="#D97706" strokeWidth="0.5"/>
        <defs>
            <linearGradient id="paint0_linear_yellow_diamond" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FCD34D"/>
                <stop offset="1" stopColor="#F59E0B"/>
            </linearGradient>
        </defs>
    </svg>
);
