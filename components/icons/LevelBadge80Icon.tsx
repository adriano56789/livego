import React from 'react';

const LevelBadge80Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="grad80" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop stopColor="#F472B6"/>
                <stop offset="1" stopColor="#DB2777"/>
            </linearGradient>
            <linearGradient id="diamond80" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop stopColor="#FDE047"/>
                <stop offset="1" stopColor="#F59E0B"/>
            </linearGradient>
        </defs>
        <path d="M32 22C18 22 16 34 16 34C16 44 24 50 32 50C40 50 48 44 48 34C48 34 46 22 32 22Z" fill="url(#grad80)"/>
        <path d="M32 14L26 26H38L32 14Z" fill="#F9A8D4"/>
        <path d="M42 24L36 30L44 36L42 24Z" fill="#F9A8D4"/>
        <path d="M22 24L28 30L20 36L22 24Z" fill="#F9A8D4"/>
        <path d="M26 44L32 38L38 44L32 54L26 44Z" fill="#FBCFE8"/>

        {/* Diamond */}
        <path d="M32 4L38 10L32 16L26 10L32 4Z" fill="url(#diamond80)"/>
        <path d="M26 10L38 10L32 16L26 10Z" fill="#FBBF24"/>
        <path d="M32 4L26 10H38L32 4Z" fill="#FEF9C3"/>
    </svg>
);

export default LevelBadge80Icon;
