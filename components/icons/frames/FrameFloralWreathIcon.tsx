import React from 'react';

export const FrameFloralWreathIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <radialGradient id="gradBlossom" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fce7f3" />
                <stop offset="100%" stopColor="#f9a8d4" />
            </radialGradient>
        </defs>
        {[...Array(8)].map((_, i) => (
            <g key={i} transform={`rotate(${i * 45} 50 50)`}>
                <g transform="translate(50, 10)">
                    <circle cx="0" cy="0" r="6" fill="url(#gradBlossom)" />
                    <circle cx="0" cy="0" r="2" fill="#fecdd3" />
                </g>
                <path d="M50 16 C 40 25, 60 25, 50 35" stroke="#4d7c0f" strokeWidth="1" fill="none" />
            </g>
        ))}
    </svg>
);