import React from 'react';

export const LionGiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="100%" height="100%" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="lionGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
            <linearGradient id="lionDarkGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
        </defs>
        <path d="M12 20 L 20 12 L 44 12 L 52 20 L 52 44 L 44 52 L 20 52 L 12 44 Z" fill="url(#lionDarkGold)" />
        <path d="M16 22 L 22 16 L 42 16 L 48 22 L 48 42 L 42 48 L 22 48 L 16 42 Z" fill="url(#lionGold)" />
        <path d="M32 24 L 36 28 L 32 32 L 28 28 Z" fill="url(#lionDarkGold)" />
        <path d="M24 34 L 28 38 L 24 42" stroke="url(#lionDarkGold)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M40 34 L 36 38 L 40 42" stroke="url(#lionDarkGold)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M32 38 L 32 44" stroke="url(#lionDarkGold)" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
);