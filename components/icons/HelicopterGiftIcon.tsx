import React from 'react';

export const HelicopterGiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="100%" height="100%" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="heliBody" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4b5563" />
                <stop offset="100%" stopColor="#1f2937" />
            </linearGradient>
            <linearGradient id="heliGlass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
        </defs>
        <rect x="10" y="20" width="44" height="4" rx="2" fill="#9ca3af" />
        <path d="M16,28 C16,24 20,22 32,22 C44,22 48,24 48,28 L56,36 L52,44 L12,44 L8,36 Z" fill="url(#heliBody)" />
        <path d="M20,28 L44,28 C46,28 48,30 48,32 L48,36 L16,36 L16,32 C16,30 18,28 20,28 Z" fill="url(#heliGlass)" />
        <path d="M52,44 L56,52 L48,52" fill="#4b5563" />
        <rect x="20" y="44" width="24" height="4" rx="2" fill="#4b5563" />
    </svg>
);