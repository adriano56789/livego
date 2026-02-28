import React from 'react';

export const PlanetGiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="100%" height="100%" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="planetBody" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f9a8d4" />
                <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <linearGradient id="planetRing" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#fde047" />
            </linearGradient>
        </defs>
        <ellipse cx="32" cy="32" rx="20" ry="8" fill="url(#planetRing)" transform="rotate(-20 32 32)" />
        <circle cx="32" cy="32" r="16" fill="url(#planetBody)" />
        <path d="M24,24 C28,20 36,20 40,24" stroke="#db2777" strokeWidth="2" fill="none" />
        <path d="M22,32 C28,28 36,28 42,32" stroke="#db2777" strokeWidth="2" fill="none" />
    </svg>
);