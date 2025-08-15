import React from 'react';

const LevelBadge150Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="grad150" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop stopColor="#F97316"/>
                <stop offset="1" stopColor="#DC2626"/>
            </linearGradient>
        </defs>
        <path d="M32 4L54 16V40C54 48 44 54 32 60C20 54 10 48 10 40V16L32 4Z" fill="url(#grad150)"/>
        <path d="M32 4L10 16V40C10 48 20 54 32 60" fill="#F87171"/>
        <path d="M22 28L32 34L42 28L32 22L22 28Z" fill="#FBBF24"/>
        <path d="M22 36L32 42L42 36L32 30L22 36Z" fill="#FBBF24" opacity="0.7"/>
    </svg>
);

export default LevelBadge150Icon;
