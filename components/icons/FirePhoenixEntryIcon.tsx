import React from 'react';

export const FirePhoenixEntryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="100%" height="100%" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <radialGradient id="firePhoenixGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="60%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ef4444" />
            </radialGradient>
        </defs>
        <path d="M32,10 C 50,20 52,40 46,54 C 40,40 36,32 32,30 C 28,32 24,40 18,54 C 12,40 14,20 32,10 Z" fill="url(#firePhoenixGlow)" />
        <path d="M32,18 C 40,26 42,40 38,50 C 36,40 34,35 32,34 C 30,35 28,40 26,50 C 22,40 24,26 32,18 Z" fill="#fde047" />
    </svg>
);
