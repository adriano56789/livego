import React from 'react';

export const RingGiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="100%" height="100%" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="ringGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
            <linearGradient id="ringDiamond" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a5f3fc" />
                <stop offset="100%" stopColor="#67e8f9" />
            </linearGradient>
        </defs>
        <path d="M32 40 C 20 40 16 52 16 56 C 16 60 20 62 32 62 C 44 62 48 60 48 56 C 48 52 44 40 32 40 Z" fill="url(#ringGold)" />
        <path d="M32 42 C 22 42 18 52 18 55 C 18 58 22 60 32 60 C 42 60 46 58 46 55 C 46 52 42 42 32 42 Z" fill="#fef3c7" />
        <path d="M24 24 L 40 24 L 48 36 L 16 36 L 24 24 Z" fill="#9ca3af"/>
        <path d="M22 8 L 42 8 L 36 24 L 28 24 L 22 8 Z" fill="url(#ringDiamond)" />
        <path d="M22 8 L 28 24 L 32 16 L 22 8 Z" fill="#e0f2fe" />
        <path d="M42 8 L 36 24 L 32 16 L 42 8 Z" fill="#0c4a6e" opacity="0.2"/>
    </svg>
);