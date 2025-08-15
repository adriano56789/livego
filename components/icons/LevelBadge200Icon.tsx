import React from 'react';

const LevelBadge200Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <radialGradient id="grad200" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="#A78BFA"/>
                <stop offset="100%" stopColor="#4C1D95"/>
            </radialGradient>
        </defs>
        <path d="M32 2L42 22L62 22L47 36L52 56L32 44L12 56L17 36L2 22L22 22L32 2Z" fill="url(#grad200)"/>
        <path d="M32 2L39 26L25 26L32 2Z" fill="#C4B5FD"/>
    </svg>
);

export default LevelBadge200Icon;
