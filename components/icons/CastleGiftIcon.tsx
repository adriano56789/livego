import React from 'react';

export const CastleGiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="100%" height="100%" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="castlePurple" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#7e22ce" />
            </linearGradient>
            <linearGradient id="castleDarkPurple" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#581c87" />
                <stop offset="100%" stopColor="#3b0764" />
            </linearGradient>
        </defs>
        <path d="M12,24 L12,56 L52,56 L52,24 L44,24 L44,16 L36,8 L28,16 L28,24 Z" fill="url(#castleDarkPurple)" />
        <path d="M16,28 L16,52 L48,52 L48,28 L40,28 L40,20 L32,12 L24,20 L24,28 Z" fill="url(#castlePurple)" />
        <rect x="28" y="40" width="8" height="12" fill="url(#castleDarkPurple)" />
    </svg>
);