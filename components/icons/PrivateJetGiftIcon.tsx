import React from 'react';

export const PrivateJetGiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="100%" height="100%" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="jetBodyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e5e7eb" />
                <stop offset="100%" stopColor="#9ca3af" />
            </linearGradient>
            <linearGradient id="jetDetailGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
        </defs>
        <g transform="rotate(-20 32 32)">
            <path d="M32 10 L 52 28 L 50 38 L 36 32 L 28 48 L 22 46 L 28 30 L 14 36 L 12 26 L 32 10 Z" fill="url(#jetBodyGrad)" />
            <path d="M32 12 L 48 27 L 46 35 L 34 30 L 32 12 Z" fill="#d1d5db" />
            <path d="M32 20 L 16 28 L 14 26 L 32 20 Z" fill="#d1d5db" />
            <path d="M30 46 L 24 44 L 28 32 L 30 34 L 30 46 Z" fill="url(#jetDetailGrad)" />
            <rect x="33" y="23" width="4" height="6" rx="1" fill="#0ea5e9" />
        </g>
    </svg>
);