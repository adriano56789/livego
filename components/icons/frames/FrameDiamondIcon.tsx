import React from 'react';

export const FrameDiamondIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="gradClassicSilver" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="50%" stopColor="#d1d5db" />
                <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="40" stroke="url(#gradClassicSilver)" strokeWidth="3" />
        <circle cx="50" cy="50" r="36" stroke="#9ca3af" strokeWidth="0.5" />
    </svg>
);