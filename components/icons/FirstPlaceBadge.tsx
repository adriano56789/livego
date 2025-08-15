
import React from 'react';

const FirstPlaceBadge: React.FC<{ avatarUrl: string }> = ({ avatarUrl }) => (
    <div className="relative flex flex-col items-center z-10">
        <div className="relative">
            <svg width="60" height="40" viewBox="0 0 78 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -top-6 -left-2">
                <path d="M22.5 25C22.5 25 24.3333 19.3333 30.5 16L39 3.5L48 16C54.1667 19.3333 56 25 56 25L77.5 12.5L62.5 31.5L47.5 49.5H31L16 31.5L1 12.5L22.5 25Z" fill="url(#paint0_linear_1_1)"/>
                <defs>
                <linearGradient id="paint0_linear_1_1" x1="39.25" y1="3.5" x2="39.25" y2="49.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="#A855F7"/>
                <stop offset="1" stopColor="#6D28D9"/>
                </linearGradient>
                </defs>
            </svg>
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 text-white font-bold text-sm bg-purple-700 px-1.5 rounded-sm">1</span>
        </div>
        <img src={avatarUrl} alt="1st place" className="w-10 h-10 rounded-full border-2 border-purple-400" />
    </div>
);

export default FirstPlaceBadge;
