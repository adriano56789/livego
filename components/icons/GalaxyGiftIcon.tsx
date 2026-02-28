import React from 'react';

export const GalaxyGiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="100%" height="100%" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <radialGradient id="galaxyCenter" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#f0abfc" stopOpacity="0" />
            </radialGradient>
        </defs>
        <rect width="64" height="64" fill="#1e1b4b" rx="12" />
        <circle cx="32" cy="32" r="12" fill="url(#galaxyCenter)" />
        <path d="M32,32 C 48,24 48,40 32,48" stroke="#a855f7" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M32,32 C 16,40 16,24 32,16" stroke="#c084fc" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="12" cy="18" r="2" fill="white" />
        <circle cx="52" cy="46" r="3" fill="white" />
        <circle cx="48" cy="12" r="1.5" fill="white" />
    </svg>
);