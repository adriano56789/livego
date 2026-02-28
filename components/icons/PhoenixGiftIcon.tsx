import React from 'react';

export const PhoenixGiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="100%" height="100%" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="phoenixOrange" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
            <linearGradient id="phoenixRed" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
        </defs>
        <path d="M32,20 C40,12 48,12 56,20 C52,28 48,36 48,44 C48,52 40,60 32,60 C24,60 16,52 16,44 C16,36 12,28 8,20 C16,12 24,12 32,20 Z" fill="url(#phoenixRed)" />
        <path d="M32,24 C38,18 44,18 50,24 C47,30 44,36 44,42 C44,48 38,54 32,54 C26,54 20,48 20,42 C20,36 17,30 14,24 C20,18 26,18 32,24 Z" fill="url(#phoenixOrange)" />
        <path d="M32,4 C32,4 40,12 40,20 C40,28 32,32 32,32 C32,32 24,28 24,20 C24,12 32,4 32,4 Z" fill="#fef08a" />
    </svg>
);