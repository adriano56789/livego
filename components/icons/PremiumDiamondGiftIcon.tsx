import React from 'react';

export const PremiumDiamondGiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="100%" height="100%" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="diamondBlue" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
            <linearGradient id="diamondLightBlue" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a5f3fc" />
                <stop offset="100%" stopColor="#cffafe" />
            </linearGradient>
        </defs>
        <path d="M8,24 L32,56 L56,24 L32,8 Z" fill="url(#diamondBlue)" />
        <path d="M8,24 L32,24 L32,8 Z" fill="#0e7490" opacity="0.5" />
        <path d="M56,24 L32,24 L32,8 Z" fill="#0e7490" opacity="0.2" />
        <path d="M32,56 L16,24 L48,24 Z" fill="#0e7490" opacity="0.3" />
        <path d="M16,24 L32,32 L48,24 L32,8 Z" fill="url(#diamondLightBlue)" />
    </svg>
);