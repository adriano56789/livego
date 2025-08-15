import React from 'react';

const LevelBadge1000Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="grad1000" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop stopColor="#F9A8D4"/>
                <stop offset="1" stopColor="#7E22CE"/>
            </linearGradient>
             <linearGradient id="flame1000" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop stopColor="#FDE047"/>
                <stop offset="1" stopColor="#F97316"/>
            </linearGradient>
        </defs>
        <path d="M32 6L12 18V42L32 58L52 42V18L32 6Z" fill="url(#grad1000)" stroke="#FBCFE8" strokeWidth="1"/>
        <path d="M32 20C26 24 26 36 32 44C38 36 38 24 32 20Z" fill="url(#flame1000)"/>
        <path d="M32 16C28 20 28 30 32 36C36 30 36 20 32 16Z" fill="#FEF08A"/>
    </svg>
);

export default LevelBadge1000Icon;
