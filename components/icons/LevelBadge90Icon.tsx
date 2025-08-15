import React from 'react';

const LevelBadge90Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="grad90" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop stopColor="#EC4899"/>
                <stop offset="1" stopColor="#BE185D"/>
            </linearGradient>
             <linearGradient id="crown90" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop stopColor="#FDE047"/>
                <stop offset="1" stopColor="#F59E0B"/>
            </linearGradient>
        </defs>
        <path d="M32 24C18 24 16 36 16 36C16 46 24 52 32 52C40 52 48 46 48 36C48 36 46 24 32 24Z" fill="url(#grad90)"/>
        <path d="M32 16L26 28H38L32 16Z" fill="#F9A8D4"/>
        <path d="M42 26L36 32L44 38L42 26Z" fill="#F9A8D4"/>
        <path d="M22 26L28 32L20 38L22 26Z" fill="#F9A8D4"/>
        <path d="M26 46L32 40L38 46L32 56L26 46Z" fill="#FBCFE8"/>

        {/* Crown */}
        <path d="M24 8L20 18H44L40 8L36 14L32 8L28 14L24 8Z" fill="url(#crown90)"/>
        <circle cx="20" cy="18" r="2" fill="#FDE047"/>
        <circle cx="32" cy="8" r="2" fill="#FDE047"/>
        <circle cx="44" cy="18" r="2" fill="#FDE047"/>
    </svg>
);

export default LevelBadge90Icon;
