import React from 'react';

const OrnateProtectorFrame: React.FC<{ children: React.ReactNode, index: number }> = ({ children, index }) => {
    // Different gradients to match the screenshot's variety
    const gradients = [
        { id: 'grad1', from: '#38bdf8', to: '#a78bfa' }, // Light Blue to Purple
        { id: 'grad2', from: '#fde047', to: '#f59e0b' }, // Yellow to Orange
        { id: 'grad3', from: '#4ade80', to: '#2dd4bf' }, // Green to Teal
        { id: 'grad4', from: '#f472b6', to: '#ec4899' }, // Light Pink to Pink
        { id: 'grad5', from: '#e5e7eb', to: '#9ca3af' }, // Silver
    ];
    const selectedGradient = gradients[index % gradients.length];

    return (
        <div className="relative w-16 h-16">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id={selectedGradient.id} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={selectedGradient.from} />
                        <stop offset="100%" stopColor={selectedGradient.to} />
                    </linearGradient>
                     <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                 {/* Outer ring with glow */}
                <circle cx="50" cy="50" r="48" stroke={`url(#${selectedGradient.id})`} strokeWidth="3" filter="url(#glow)" opacity="0.4"/>
                
                {/* Main frame shape */}
                <path d="M50 4 L65 10 L75 20 L80 35 L80 65 L75 80 L65 90 L50 96 L35 90 L25 80 L20 65 L20 35 L25 20 L35 10 Z" 
                      fill="#27272a" stroke="#4b5563" strokeWidth="2"/>

                {/* Inner border */}
                 <circle cx="50" cy="50" r="40" stroke={`url(#${selectedGradient.id})`} strokeWidth="1" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-[80%] h-[80%] rounded-full overflow-hidden">
                     {children}
                </div>
            </div>
        </div>
    );
};

export default OrnateProtectorFrame;
