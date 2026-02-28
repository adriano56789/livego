import React from 'react';

export const FrameNeonPinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <path id="rune-path" d="M 50, 50 m -38, 0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
        </defs>
        <circle cx="50" cy="50" r="42" stroke="#1e3a8a" strokeWidth="5" />
        <text dy="-2">
            <textPath href="#rune-path" style={{ fill: '#60a5fa', fontSize: '12px', letterSpacing: '4' }}>
                ᛒᛟᛟᚾᛞᛟᚲᛋ᛫ᚠᛟᚱ᛫ᛚᛁᚠᛖᚷᛟ᛫ᛒᛟᛟᚾᛞᛟᚲᛋ
            </textPath>
        </text>
    </svg>
);