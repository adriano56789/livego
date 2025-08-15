import React from 'react';

const LevelBadge300Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="grad300" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop stopColor="#FDE047"/>
                <stop offset="1" stopColor="#B45309"/>
            </linearGradient>
             <linearGradient id="wing300" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop stopColor="#FEF9C3"/>
                <stop offset="1" stopColor="#FDE047"/>
            </linearGradient>
        </defs>
        <path d="M32 10C16 10 12 28 12 36C12 48 20 54 32 54C44 54 52 48 52 36C52 28 48 10 32 10Z" fill="url(#grad300)"/>
        <path d="M52 36C62 32, 64 48, 54 48" fill="url(#wing300)"/>
        <path d="M12 36C2 32, 0 48, 10 48" fill="url(#wing300)"/>
    </svg>
);

export default LevelBadge300Icon;
