import React from 'react';

export const FramePinkGemIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="gradRoyalGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef9c3" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#fef9c3" />
            </linearGradient>
            <radialGradient id="gradRoyalGem">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#b91c1c" />
            </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="40" stroke="url(#gradRoyalGold)" strokeWidth="3" />
        <path d="M15 50 C 10 30, 30 10, 50 15 C 70 10, 90 30, 85 50 C 90 70, 70 90, 50 85 C 30 90, 10 70, 15 50 Z" stroke="#ca8a04" strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx="50" cy="15" r="5" fill="url(#gradRoyalGem)" stroke="#fef9c3" strokeWidth="1" />
    </svg>
);