import React from 'react';

export const LuxuryCarEntryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="100%" height="100%" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="luxuryCarBody" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#d8b4fe" />
                <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="luxuryCarShine" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0.5" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
        </defs>
        <path d="M10 38 L 16 30 L 22 30 L 28 22 L 50 22 L 58 34 L 54 44 L 10 44 Z" fill="url(#luxuryCarBody)" />
        <path d="M18 30 L 24 30 L 30 24 L 48 24 L 54 32 L 50 38 L 18 38 Z" fill="url(#luxuryCarShine)" />
        <circle cx="18" cy="44" r="6" fill="#1f2937" />
        <circle cx="48" cy="44" r="6" fill="#1f2937" />
        <circle cx="18" cy="44" r="3" fill="#94a3b8" />
        <circle cx="48" cy="44" r="3" fill="#94a3b8" />
    </svg>
);
