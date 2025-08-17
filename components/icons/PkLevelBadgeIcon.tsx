import React from 'react';

const PkLevelBadgeIcon: React.FC<{ text: string, level: 'A' | 'C', className?: string }> = ({ text, level, className }) => {
    const borderColor = level === 'A' ? '#FBBF24' : '#94A3B8';

    return (
        <div className={`relative inline-flex items-center justify-center h-8 w-auto px-1 ${className}`}>
            <svg className="absolute h-full w-full" viewBox="0 0 42 40" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <path d="M21 0L41.3205 10V30L21 40L0.679494 30V10L21 0Z" fill={`url(#pk_badge_grad_${level})`} stroke={borderColor} strokeWidth="1"/>
                 <path d="M21 21.5L24 19L21 16.5L18 19L21 21.5Z" fill="white" fillOpacity="0.5"/>
                <defs>
                    <linearGradient id={`pk_badge_grad_${level}`} x1="21" y1="0" x2="21" y2="40" gradientUnits="userSpaceOnUse">
                         <stop stopColor={level === 'A' ? '#F59E0B' : '#64748B'}/>
                         <stop offset="1" stopColor={level === 'A' ? '#B45309' : '#334155'}/>
                    </linearGradient>
                </defs>
            </svg>
            <span className="relative z-10 text-white font-bold text-sm drop-shadow-md">{text}</span>
        </div>
    );
};

export default PkLevelBadgeIcon;
