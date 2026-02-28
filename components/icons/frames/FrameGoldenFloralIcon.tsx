import React from 'react';

export const FrameGoldenFloralIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="gradFrozenShard" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#e0f2fe" />
                <stop offset="100%" stopColor="#67e8f9" />
            </linearGradient>
        </defs>
        {[...Array(18)].map((_, i) => (
            <g key={i} transform={`rotate(${i * 20} 50 50)`}>
                <path d={`M50 8 L ${48 + (i % 2 * 4)} 18 L ${52 - (i % 2 * 4)} 18 Z`} fill="url(#gradFrozenShard)" />
            </g>
        ))}
    </svg>
);