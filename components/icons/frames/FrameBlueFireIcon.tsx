import React from 'react';

export const FrameBlueFireIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="gradDragonScale" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <path id="scale-path" d="M -5 0 C -2 -5, 2 -5, 5 0 C 2 5, -2 5, -5 0 Z" />
        </defs>
        {[...Array(12)].map((_, i) => (
            <g key={i} transform={`rotate(${i * 30} 50 50)`}>
                <use href="#scale-path" fill="url(#gradDragonScale)" transform="translate(50, 10) scale(1.2)" />
            </g>
        ))}
    </svg>
);