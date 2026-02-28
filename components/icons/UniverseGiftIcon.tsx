import React from 'react';

export const UniverseGiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="100%" height="100%" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <radialGradient id="universeGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="#f0abfc" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#3b0764" />
            </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="28" fill="url(#universeGlow)" />
        <circle cx="20" cy="20" r="2" fill="white" opacity="0.8" />
        <circle cx="45" cy="45" r="3" fill="white" opacity="0.9" />
        <circle cx="50" cy="25" r="1.5" fill="white" opacity="0.7" />
        <circle cx="15" cy="40" r="2.5" fill="white" opacity="0.85" />
        <path d="M20 40 Q 32 32, 44 42" stroke="white" strokeWidth="1" fill="none" opacity="0.5" />
        <path d="M18 22 Q 32 28, 46 20" stroke="white" strokeWidth="1.5" fill="none" opacity="0.6" />
    </svg>
);