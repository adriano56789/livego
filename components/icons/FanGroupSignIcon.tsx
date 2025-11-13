import React from 'react';

export const FanGroupSignIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="120" height="70" viewBox="0 0 120 70" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="sign-gold-stable" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop stopColor="#FCD34D"/>
                <stop offset="1" stopColor="#F59E0B"/>
            </linearGradient>
        </defs>
        <g>
            <rect x="5" y="5" width="110" height="60" rx="10" fill="#FBBF24" stroke="url(#sign-gold-stable)" strokeWidth="4"/>
            <circle cx="15" cy="15" r="3" fill="url(#sign-gold-stable)"/>
            <circle cx="35" cy="15" r="3" fill="url(#sign-gold-stable)"/>
            <circle cx="55" cy="15" r="3" fill="url(#sign-gold-stable)"/>
            <circle cx="75" cy="15" r="3" fill="url(#sign-gold-stable)"/>
            <circle cx="95" cy="15" r="3" fill="url(#sign-gold-stable)"/>
            
            <circle cx="15" cy="55" r="3" fill="url(#sign-gold-stable)"/>
            <circle cx="35" cy="55" r="3" fill="url(#sign-gold-stable)"/>
            <circle cx="55" cy="55" r="3" fill="url(#sign-gold-stable)"/>
            <circle cx="75" cy="55" r="3" fill="url(#sign-gold-stable)"/>
            <circle cx="95" cy="55" r="3" fill="url(#sign-gold-stable)"/>

            <text x="60" y="32" fontFamily="'Arial Black', Gadget, sans-serif" fontSize="12" fill="#78350f" textAnchor="middle" dominantBaseline="central">GRUPOS</text>
            <text x="60" y="48" fontFamily="'Arial Black', Gadget, sans-serif" fontSize="12" fill="#78350f" textAnchor="middle" dominantBaseline="central">DE FÃS</text>
        </g>
    </svg>
);