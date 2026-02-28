import React from 'react';

export const DragonGiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="100%" height="100%" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="dragonGreen" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
        </defs>
        <g transform="translate(4, 4)">
            <path d="M48,8 C52,4 56,4 56,8 C56,12 52,16 48,12 M40,4 C48,0 52,4 52,12 C52,20 44,24 40,20" stroke="url(#dragonGreen)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12,20 C4,28 4,36 12,44 C20,52 28,52 36,44 C44,36 48,28 48,20 C48,12 40,8 32,8 C24,8 16,12 12,20 Z" fill="url(#dragonGreen)" />
            <path d="M16,24 C12,30 12,36 16,40 C20,44 26,44 30,40 C34,36 36,30 36,24 C36,18 30,14 24,14 C18,14 16,18 16,24 Z" fill="#bbf7d0" />
            <circle cx="24" cy="24" r="3" fill="#052e16" />
        </g>
    </svg>
);