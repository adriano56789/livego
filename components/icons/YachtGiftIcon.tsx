import React from 'react';

export const YachtGiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="100%" height="100%" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="yachtWhite" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#d1d5db" />
            </linearGradient>
            <linearGradient id="yachtBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
        </defs>
        <path d="M4 44 L 60 44 L 52 52 L 12 52 Z" fill="url(#yachtBlue)" />
        <path d="M8 44 L 56 44 L 52 36 L 12 36 Z" fill="url(#yachtWhite)" />
        <path d="M16 36 L 48 36 L 44 28 L 20 28 Z" fill="#e5e7eb" />
        <path d="M24 28 L 40 28 L 38 22 L 26 22 Z" fill="#9ca3af" />
        <path d="M4 52 C 12 56, 20 50, 32 52 C 44 54, 52 48, 60 52 L 60 60 L 4 60 Z" fill="url(#water)" />
    </svg>
);