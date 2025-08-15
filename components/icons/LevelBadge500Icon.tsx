import React from 'react';

const LevelBadge500Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <radialGradient id="grad500" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="#1E3A8A"/>
                <stop offset="100%" stopColor="#111827"/>
            </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="url(#grad500)"/>
        <circle cx="32" cy="32" r="10" fill="#BEF264"/>
        <path d="M32 12L36 28L52 32L36 36L32 52L28 36L12 32L28 28L32 12Z" fill="#FEF08A"/>
    </svg>
);

export default LevelBadge500Icon;
