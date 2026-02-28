import React from 'react';

export const DragonEntryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="100%" height="100%" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="dragonScale" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
        </defs>
        <path d="M12,32 C 12,16 32,8 44,16 C 52,20 52,28 48,32 C 52,36 52,44 44,48 C 32,56 12,48 12,32 Z" fill="url(#dragonScale)" />
        <path d="M20,32 C 20,22 32,18 40,22 C 44,24 44,28 42,32 C 44,36 44,40 40,42 C 32,46 20,42 20,32 Z" fill="#a5f3fc" />
        <circle cx="36" cy="28" r="3" fill="#083344" />
        <path d="M12,32 C 16,30 20,28 24,28 M14,36 C 18,34 22,32 26,32 M14,28 C 18,26 22,24 26,24" stroke="#0e7490" strokeWidth="2" fill="none" />
    </svg>
);
