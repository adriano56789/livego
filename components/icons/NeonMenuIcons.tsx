
import React from 'react';

const BaseNeonIcon: React.FC<React.SVGProps<SVGSVGElement> & { 
    id: string; 
    colorFrom: string; 
    colorTo: string; 
    glowColor: string;
    children: React.ReactNode 
}> = ({ id, colorFrom, colorTo, glowColor, children, ...props }) => (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id={`grad_${id}`} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor={colorFrom} />
                <stop offset="1" stopColor={colorTo} />
            </linearGradient>
            <filter id={`glow_${id}`} x="-10" y="-10" width="68" height="68" filterUnits="userSpaceOnUse">
                <feGaussianBlur stdDeviation="2" result="effect1_foregroundBlur"/>
            </filter>
        </defs>
        {/* Glow behind */}
        <rect x="6" y="6" width="36" height="36" rx="10" fill={glowColor} fillOpacity="0.4" filter={`url(#glow_${id})`} />
        {/* Main Box */}
        <rect x="4" y="4" width="40" height="40" rx="10" fill={`url(#grad_${id})`} stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
        {/* Inner Icon */}
        <g transform="translate(12, 12) scale(1)">
            {children}
        </g>
    </svg>
);

export const NeonWalletIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <BaseNeonIcon id="wallet" colorFrom="#F59E0B" colorTo="#B45309" glowColor="#F59E0B" {...props}>
        <path d="M19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 12H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 13H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </BaseNeonIcon>
);

export const NeonStoreIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <BaseNeonIcon id="store" colorFrom="#3B82F6" colorTo="#1E40AF" glowColor="#3B82F6" {...props}>
        <path d="M3 3L21 3L19 14H5L3 3Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 6H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19 14V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 21V14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </BaseNeonIcon>
);

export const NeonRankIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <BaseNeonIcon id="rank" colorFrom="#EAB308" colorTo="#A16207" glowColor="#EAB308" {...props}>
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.2)"/>
    </BaseNeonIcon>
);

export const NeonFansIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <BaseNeonIcon id="fans" colorFrom="#10B981" colorTo="#047857" glowColor="#10B981" {...props}>
        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </BaseNeonIcon>
);

export const NeonBlockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <BaseNeonIcon id="block" colorFrom="#EF4444" colorTo="#991B1B" glowColor="#EF4444" {...props}>
        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
        <path d="M4.92993 4.92999L19.07 19.07" stroke="white" strokeWidth="2"/>
    </BaseNeonIcon>
);

export const NeonShieldIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <BaseNeonIcon id="shield" colorFrom="#8B5CF6" colorTo="#5B21B6" glowColor="#8B5CF6" {...props}>
        <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </BaseNeonIcon>
);

export const NeonSupportIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <BaseNeonIcon id="support" colorFrom="#06B6D4" colorTo="#155E75" glowColor="#06B6D4" {...props}>
        <path d="M3 18V12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12V18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 19C21 20.1046 20.1046 21 19 21H18V15H19C20.1046 15 21 15.8954 21 17V19Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 19C3 20.1046 3.89543 21 5 21H6V15H5C3.89543 15 3 15.8954 3 17V19Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </BaseNeonIcon>
);

export const NeonMessageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <BaseNeonIcon id="msg" colorFrom="#374151" colorTo="#111827" glowColor="#374151" {...props}>
         <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H6L2 24V6C2 4.9 2.9 4 4 4Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </BaseNeonIcon>
);

export const NeonFAQIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <BaseNeonIcon id="faq" colorFrom="#374151" colorTo="#111827" glowColor="#374151" {...props}>
        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
        <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 17H12.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </BaseNeonIcon>
);

export const NeonSettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <BaseNeonIcon id="settings" colorFrom="#374151" colorTo="#111827" glowColor="#374151" {...props}>
         <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
         <path d="M19.4 15C20.3239 15 21.0728 15.7489 21.0728 16.6728V16.9248C21.0728 17.5855 20.6586 18.1728 20.0388 18.3908C18.6657 18.8735 17.189 19.1364 15.65 19.1364C14.111 19.1364 12.6343 18.8735 11.2612 18.3908C10.6414 18.1728 10.2272 17.5855 10.2272 16.9248V16.6728C10.2272 15.7489 10.9761 15 11.9 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0"/>
         <path d="M19.66 12.83L21.41 14.58C21.6 14.77 21.6 15.08 21.41 15.27L20.27 16.41C20.08 16.6 19.77 16.6 19.58 16.41L17.83 14.66C17.74 14.57 17.61 14.52 17.48 14.52C17.06 14.72 16.61 14.88 16.14 14.98C16.01 15.01 15.91 15.11 15.89 15.24L15.63 17.71C15.61 17.97 15.39 18.17 15.13 18.17H13.52C13.26 18.17 13.04 17.97 13.02 17.71L12.76 15.24C12.74 15.11 12.64 15.01 12.51 14.98C12.04 14.88 11.59 14.72 11.17 14.52C11.04 14.52 10.91 14.57 10.82 14.66L9.07 16.41C8.88 16.6 8.57 16.6 8.38 16.41L7.24 15.27C7.05 15.08 7.05 14.77 7.24 14.58L8.99 12.83C9.08 12.74 9.13 12.61 9.13 12.48C9.13 12 9.13 11.52 9.13 11.04C9.13 10.91 9.08 10.78 8.99 10.69L7.24 8.94C7.05 8.8 7.05 8.49 7.24 8.3L8.38 7.16C8.57 6.97 8.88 6.97 9.07 7.16L10.82 8.91C10.91 9 11.04 9.05 11.17 9.05C11.59 8.85 12.04 8.69 12.51 8.59C12.64 8.56 12.74 8.46 12.76 8.33L13.02 5.86C13.04 5.6 13.26 5.4 13.52 5.4H15.13C15.39 5.4 15.61 5.6 15.63 5.86L15.89 8.33C15.91 8.46 16.01 8.56 16.14 8.59C16.61 8.69 17.06 8.85 17.48 9.05C17.61 9.05 17.74 9 17.83 8.91L19.58 7.16C19.77 6.97 20.08 6.97 20.27 7.16L21.41 8.3C21.6 8.49 21.6 8.8 21.41 8.99L19.66 10.74C19.57 10.83 19.52 10.96 19.52 11.09C19.52 11.57 19.52 12.05 19.52 12.53C19.52 12.66 19.57 12.79 19.66 12.83Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </BaseNeonIcon>
);

export const NeonAdminIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <BaseNeonIcon id="admin" colorFrom="#FBBF24" colorTo="#B45309" glowColor="#FBBF24" {...props}>
        <path d="M3 21H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 21V10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19 21V10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 10L12 3L19 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 12V18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </BaseNeonIcon>
);

