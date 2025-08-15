import React from 'react';

const LevelBadge100Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="grad100" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop stopColor="#3B82F6"/>
                <stop offset="1" stopColor="#2563EB"/>
            </linearGradient>
            <linearGradient id="wing100" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop stopColor="#93C5FD"/>
                <stop offset="1" stopColor="#60A5FA"/>
            </linearGradient>
        </defs>
        {/* Base hexagon */}
        <path d="M32 10L52 22V46L32 58L12 46V22L32 10Z" fill="url(#grad100)" stroke="#93C5FD" strokeWidth="1.5"/>
        
        {/* Wings */}
        <path d="M52 22C60 18, 62 32, 52 32" fill="url(#wing100)"/>
        <path d="M50 26C58 24, 60 36, 50 36" fill="url(#wing100)" opacity="0.7"/>
        <path d="M12 22C4 18, 2 32, 12 32" fill="url(#wing100)"/>
        <path d="M14 26C6 24, 4 36, 14 36" fill="url(#wing100)" opacity="0.7"/>

        {/* Center Detail */}
        <path d="M32 10L24 22H40L32 10Z" fill="#93C5FD"/>
        <path d="M32 58L24 46H40L32 58Z" fill="#BFDBFE"/>
    </svg>
);

export default LevelBadge100Icon;
