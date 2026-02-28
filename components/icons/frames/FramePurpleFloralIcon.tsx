import React from 'react';

export const FramePurpleFloralIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="gradPhoenixFeather" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#fef08a" />
            </linearGradient>
        </defs>
        {[...Array(24)].map((_, i) => (
            <g key={i} transform={`rotate(${i * 15} 50 50)`}>
                <path d="M50 8 C 55 20, 45 20, 50 32" stroke="url(#gradPhoenixFeather)" strokeWidth="2" strokeLinecap="round" />
            </g>
        ))}
    </svg>
);