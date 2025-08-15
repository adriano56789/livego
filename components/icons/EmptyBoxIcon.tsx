
import React from 'react';

const EmptyBoxIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="box-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="100%" stopColor="#C4B5FD" />
            </linearGradient>
            <linearGradient id="box-shadow-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#F472B6" stopOpacity="0.5" />
            </linearGradient>
        </defs>
        <ellipse cx="50" cy="85" rx="35" ry="10" fill="url(#box-shadow-grad)" />
        {/* Box Bottom */}
        <path d="M20 50 L20 80 L80 80 L80 50 L50 35 Z" fill="#F3E8FF" />
        <path d="M20 50 L50 35 L80 50 L50 65 Z" fill="#E9D5FF" />

        {/* Muted User Icon inside the box */}
        <g transform="translate(50, 58) scale(1.5) translate(-12, -12)" stroke="#a78bfa" strokeWidth="1.2" opacity="0.6" fill="none">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4l16 16" />
        </g>

        {/* Box Lid */}
        <g transform="rotate(-15 40 25)">
            <rect x="25" y="15" width="55" height="15" fill="url(#box-grad)" rx="3"/>
            <rect x="25" y="10" width="55" height="5" fill="#A78BFA" rx="2"/>
        </g>
    </svg>
);

export default EmptyBoxIcon;
