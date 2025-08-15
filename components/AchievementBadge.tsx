
import React from 'react';
import type { Achievement, AchievementFrame } from '../types';

const FramePinkOctagon: React.FC = () => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="pink-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F472B6" />
                <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
        </defs>
        <g transform="translate(40, 40)">
            <path d="M-13.4,-26.8 L13.4,-26.8 L26.8,-13.4 L26.8,13.4 L13.4,26.8 L-13.4,26.8 L-26.8,13.4 L-26.8,-13.4 Z" fill="url(#pink-grad)" stroke="#FBCFE8" strokeWidth="1"/>
            <path d="M-18 24 L -23 30 L -18 30 Z" fill="#FBBF24" />
            <path d="M18 24 L 23 30 L 18 30 Z" fill="#FBBF24" />
        </g>
    </svg>
);
const FrameSilverWinged: React.FC = () => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
         <defs>
            <linearGradient id="silver-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#E5E7EB" />
                <stop offset="100%" stopColor="#9CA3AF" />
            </linearGradient>
            <linearGradient id="blue-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
        </defs>
        <g transform="translate(40, 40)">
            <circle cx="0" cy="0" r="28" fill="url(#blue-grad)" stroke="url(#silver-grad)" strokeWidth="2"/>
        </g>
    </svg>
);
const FrameBronzeOrnate: React.FC = () => (
     <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bronze-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#9A3412" />
            </linearGradient>
        </defs>
        <g transform="translate(40, 40)">
             <circle cx="0" cy="0" r="28" fill="#422006" stroke="url(#bronze-grad)" strokeWidth="3"/>
             <circle cx="0" cy="24" r="3" fill="url(#bronze-grad)"/>
             <circle cx="0" cy="-24" r="3" fill="url(#bronze-grad)"/>
             <circle cx="24" cy="0" r="3" fill="url(#bronze-grad)"/>
             <circle cx="-24" cy="0" r="3" fill="url(#bronze-grad)"/>
        </g>
    </svg>
);
const FramePurpleGlowing: React.FC = () => (
     <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
         <defs>
            <linearGradient id="purple-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#C084FC" />
                <stop offset="100%" stopColor="#9333EA" />
            </linearGradient>
             <filter id="purple-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
         <g transform="translate(40, 40)" filter="url(#purple-glow)">
            <path d="M0-30 L15-15 L30 0 L15 15 L0 30 L-15 15 L-30 0 L-15 -15 Z" fill="url(#purple-grad)" stroke="#D8B4FE" strokeWidth="1"/>
        </g>
    </svg>
);

const FrameGoldenWinged: React.FC = () => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="gold-grad-wing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
        </defs>
        <g transform="translate(40, 40)">
            <circle cx="0" cy="0" r="28" fill="#422006" stroke="url(#gold-grad-wing)" strokeWidth="2"/>
            {/* Wings */}
            <path d="M30 0 C 50 -10, 50 10, 30 0 Z" fill="url(#gold-grad-wing)" />
            <path d="M35 5 C 55 -5, 55 15, 35 5 Z" fill="url(#gold-grad-wing)" opacity="0.7"/>
            <path d="M-30 0 C -50 -10, -50 10, -30 0 Z" fill="url(#gold-grad-wing)" />
            <path d="M-35 5 C -55 -5, -55 15, -35 5 Z" fill="url(#gold-grad-wing)" opacity="0.7"/>
            {/* Star */}
            <path d="M0 -35 L 3 -32 L 0 -29 L -3 -32 Z" fill="url(#gold-grad-wing)"/>
        </g>
    </svg>
);

const FrameGreenWinged: React.FC = () => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
         <defs>
            <linearGradient id="green-grad-wing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4ADE80" />
                <stop offset="100%" stopColor="#2DD4BF" />
            </linearGradient>
        </defs>
        <g transform="translate(40, 40)">
            <circle cx="0" cy="0" r="28" fill="#064E3B" stroke="url(#green-grad-wing)" strokeWidth="2"/>
             {/* Wings */}
            <path d="M30 0 C 50 -10, 50 10, 30 0 Z" fill="url(#green-grad-wing)" />
            <path d="M35 5 C 55 -5, 55 15, 35 5 Z" fill="url(#green-grad-wing)" opacity="0.7"/>
            <path d="M-30 0 C -50 -10, -50 10, -30 0 Z" fill="url(#green-grad-wing)" />
            <path d="M-35 5 C -55 -5, -55 15, -35 5 Z" fill="url(#green-grad-wing)" opacity="0.7"/>
        </g>
    </svg>
);

const FrameGoldenStar: React.FC = () => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="gold-grad-star" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
        </defs>
        <g transform="translate(40, 40)">
            <circle cx="0" cy="0" r="28" fill="#422006" stroke="url(#gold-grad-star)" strokeWidth="2"/>
            {/* Top Star */}
            <path d="M0 -35 L 3 -32 L 0 -29 L -3 -32 Z" fill="url(#gold-grad-star)"/>
            {/* Bottom Star */}
            <path d="M0 35 L 3 32 L 0 29 L -3 32 Z" fill="url(#gold-grad-star)"/>
            {/* Side decorations */}
             <path d="M30 -5 L 35 0 L 30 5 L 25 0 Z" fill="url(#gold-grad-star)"/>
             <path d="M-30 -5 L -35 0 L -30 5 L -25 0 Z" fill="url(#gold-grad-star)"/>
        </g>
    </svg>
);


const AchievementBadge: React.FC<Achievement> = ({ imageUrl, name, frameType }) => {
    let FrameComponent;
    switch (frameType) {
        case 'pink-octagon': FrameComponent = FramePinkOctagon; break;
        case 'silver-winged': FrameComponent = FrameSilverWinged; break;
        case 'bronze-ornate': FrameComponent = FrameBronzeOrnate; break;
        case 'purple-glowing': FrameComponent = FramePurpleGlowing; break;
        case 'golden-winged': FrameComponent = FrameGoldenWinged; break;
        case 'golden-star': FrameComponent = FrameGoldenStar; break;
        case 'green-winged': FrameComponent = FrameGreenWinged; break;
        default: FrameComponent = FrameSilverWinged; // Fallback
    }

    return (
        <button className="relative w-16 h-16 shrink-0 group" title={name}>
            <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-110">
                <FrameComponent />
            </div>
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full h-full rounded-full overflow-hidden">
                    <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                </div>
            </div>
        </button>
    );
};

export default AchievementBadge;
