import React from 'react';

export const SuperCarGiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="100%" height="100%" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="superCarBody" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
        </defs>
        <path d="M4 36 L 16 24 L 48 24 L 60 36 L 56 42 L 8 42 Z" fill="url(#superCarBody)" />
        <path d="M18 24 L 24 20 L 40 20 L 46 24" fill="#60a5fa" />
        <path d="M8 42 L 56 42 L 54 48 L 10 48 Z" fill="#1e293b" />
        <circle cx="16" cy="48" r="6" fill="#0f172a" />
        <circle cx="48" cy="48" r="6" fill="#0f172a" />
        <circle cx="16" cy="48" r="3" fill="#64748b" />
        <circle cx="48" cy="48" r="3" fill="#64748b" />
    </svg>
);