import React from 'react';

const LevelBadge60Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="grad60" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop stopColor="#60A5FA"/>
                <stop offset="1" stopColor="#2563EB"/>
            </linearGradient>
        </defs>
        <path d="M32 2L6 18V50L32 62L58 50V18L32 2Z" fill="url(#grad60)"/>
        <path d="M32 2L6 18L32 26L58 18L32 2Z" fill="#BFDBFE"/>
        <path d="M6 18L6 50L32 62V26L6 18Z" fill="#3B82F6"/>
        <path d="M58 18V50L32 62V26L58 18Z" fill="#2563EB"/>
    </svg>
);

export default LevelBadge60Icon;
