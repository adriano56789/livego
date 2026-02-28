import React from 'react';

export const KingsCrownGiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="100%" height="100%" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="crownGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
            <radialGradient id="crownJewel">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#7f1d1d" />
            </radialGradient>
        </defs>
        <path d="M8,24 L56,24 L52,48 L12,48 Z" fill="url(#crownGold)" />
        <path d="M8,24 L16,12 L32,20 L48,12 L56,24" fill="url(#crownGold)" />
        <circle cx="16" cy="12" r="4" fill="url(#crownJewel)" />
        <circle cx="32" cy="20" r="4" fill="url(#crownJewel)" />
        <circle cx="48" cy="12" r="4" fill="url(#crownJewel)" />
    </svg>
);