import React from 'react';

export const RocketGiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="100%" height="100%" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="rocketBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d8b4fe" />
                <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="rocketFlameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
        </defs>
        <g transform="rotate(-45 32 32)">
            <path d="M24,58 C24,58 20,54 20,50 L20,38 L14,38 C14,38 10,34 10,32 C10,30 14,26 14,26 L20,26 L20,14 C20,10 24,6 24,6 L40,6 C40,6 44,10 44,14 L44,26 L50,26 C50,26 54,30 54,32 C54,34 50,38 50,38 L44,38 L44,50 C44,54 40,58 40,58 L24,58 Z" fill="url(#rocketBodyGradient)" />
            <path d="M32,16 C36.418278,16 40,19.581722 40,24 C40,28.418278 36.418278,32 32,32 C27.581722,32 24,28.418278 24,24 C24,19.581722 27.581722,16 32,16 Z" fill="#9333ea" />
            <circle cx="32" cy="24" r="6" fill="#f0abfc" />
            <path d="M20,40 L16,40 C14,40 12,42 12,44 L12,52 C12,54 14,56 16,56 L20,56 L20,40 Z" fill="#c084fc" />
            <path d="M44,40 L48,40 C50,40 52,42 52,44 L52,52 C52,54 50,56 48,56 L44,56 L44,40 Z" fill="#c084fc" />
            <path d="M28,58 L36,58 C36,58 36,62 32,64 C28,62 28,58 28,58 Z" fill="url(#rocketFlameGradient)" />
        </g>
    </svg>
);