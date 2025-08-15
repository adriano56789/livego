import React from 'react';

const LevelBadge70Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="grad70" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop stopColor="#F472B6"/>
                <stop offset="1" stopColor="#DB2777"/>
            </linearGradient>
        </defs>
        <path d="M32 20C18 20 16 32 16 32C16 42 24 48 32 48C40 48 48 42 48 32C48 32 46 20 32 20Z" fill="url(#grad70)"/>
        <path d="M32 12L26 24H38L32 12Z" fill="#F9A8D4"/>
        <path d="M42 22L36 28L44 34L42 22Z" fill="#F9A8D4"/>
        <path d="M22 22L28 28L20 34L22 22Z" fill="#F9A8D4"/>
        <path d="M26 42L32 36L38 42L32 52L26 42Z" fill="#FBCFE8"/>
    </svg>
);

export default LevelBadge70Icon;
