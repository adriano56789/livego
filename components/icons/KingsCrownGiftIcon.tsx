import React from 'react';

export const KingsCrownGiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="crownGold" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stopColor="#FFD700"/>
                <stop offset="100%" stopColor="#FFA500"/>
            </linearGradient>
            <linearGradient id="crownShade" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stopColor="#DAA520"/>
                <stop offset="100%" stopColor="#B8860B"/>
            </linearGradient>
            <radialGradient id="jewelRed" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FF4136"/>
                <stop offset="100%" stopColor="#85144b"/>
            </radialGradient>
        </defs>
        
        {/* Main structure with shading */}
        <path d="M8 44 L 56 44 L 54 54 L 10 54 Z" fill="url(#crownShade)"/>
        <path d="M8,44 A 28 28 0 0 0 56 44" fill="url(#crownGold)"/>
        <path d="M8 44 L 16 20 L 24 44 Z" fill="url(#crownGold)" />
        <path d="M56 44 L 48 20 L 40 44 Z" fill="url(#crownGold)" />
        <path d="M24 44 L 32 12 L 40 44 Z" fill="url(#crownGold)" />
        <path d="M12 44 L 16 25 L 20 44 Z" fill="url(#crownShade)"/>
        <path d="M52 44 L 48 25 L 44 44 Z" fill="url(#crownShade)"/>
        <path d="M28 44 L 32 18 L 36 44 Z" fill="url(#crownShade)"/>
        
        {/* Jewels */}
        <circle cx="16" cy="24" r="4" fill="url(#jewelRed)" stroke="white" strokeWidth="0.5"/>
        <circle cx="48" cy="24" r="4" fill="url(#jewelRed)" stroke="white" strokeWidth="0.5"/>
        <circle cx="32" cy="16" r="5" fill="url(#jewelRed)" stroke="white" strokeWidth="0.5"/>
        <circle cx="32" cy="48" r="4" fill="#39CCCC" stroke="white" strokeWidth="0.5"/>
    </svg>
);