import React from 'react';

export const PrivateIslandGiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="100%" height="100%" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <radialGradient id="islandWater" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
            </radialGradient>
            <linearGradient id="islandSand" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#fef3c7" />
            </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="28" fill="url(#islandWater)" />
        <ellipse cx="32" cy="36" rx="16" ry="10" fill="url(#islandSand)" />
        <path d="M32,20 L34,36 L30,36 Z" fill="#854d0e" />
        <path d="M32,20 C 24,12 40,12 32,20 M28,24 C 20,16 36,16 28,24 M36,24 C 28,16 44,16 36,24" stroke="#16a34a" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
);