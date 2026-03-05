import React from 'react';

export const SportsCarGiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="100%" height="100%" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="carRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
        </defs>
        <path d="M8 38 L 12 30 L 24 30 L 30 24 L 50 24 L 56 32 L 56 42 L 52 42 L 50 46 L 14 46 L 12 42 L 8 42 Z" fill="url(#carRed)" />
        <path d="M14 30 L 24 30 L 28 26 L 48 26 L 52 32 L 52 36 L 16 36 L 14 30 Z" fill="#fca5a5" />
        <circle cx="18" cy="46" r="6" fill="#1f2937" />
        <circle cx="46" cy="46" r="6" fill="#1f2937" />
        <circle cx="18" cy="46" r="3" fill="#d1d5db" />
        <circle cx="46" cy="46" r="3" fill="#d1d5db" />
    </svg>
);