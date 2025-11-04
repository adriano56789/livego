import React from 'react';

export const FrameBlazingSunIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="gradCelestialWing" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5d0fe" />
                <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
        </defs>
        {/* Left Wing */}
        <g transform="translate(0 30)">
            <path d="M45,20 C 30,20 15,35 15,50 C 15,65 30,80 45,80" stroke="url(#gradCelestialWing)" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M42,25 C 32,25 22,38 22,50 C 22,62 32,75 42,75" stroke="#e9d5ff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </g>
        {/* Right Wing */}
        <g transform="translate(100 30) scale(-1, 1)">
            <path d="M45,20 C 30,20 15,35 15,50 C 15,65 30,80 45,80" stroke="url(#gradCelestialWing)" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M42,25 C 32,25 22,38 22,50 C 22,62 32,75 42,75" stroke="#e9d5ff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </g>
        {/* Center Gem */}
        <circle cx="50" cy="15" r="5" fill="#f0abfc" stroke="#a855f7" strokeWidth="1" />
    </svg>
);