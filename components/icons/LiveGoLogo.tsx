
import React from 'react';

export const LiveGoLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="250" height="150" viewBox="0 0 250 150" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="logoGradientPurple" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#A04D9C" />
        <stop offset="100%" stopColor="#4F266A" />
      </linearGradient>
    </defs>
    
    <g transform="translate(0, -10)">
        {/* Play Icon */}
        <path d="M95,25.36c-2.33-1.34-5.23,0.34-5.23,2.97v43.34c0,2.63,2.9,4.32,5.23,2.97l37.52-21.67c2.33-1.34,2.33-4.6,0-5.94L95,25.36z" fill="url(#logoGradientPurple)" />
        
        {/* Swooshes */}
        <path d="M149.3,27.5c-0.8-1.5-3.3-1.8-4.9-0.8c-1.6,1-2.1,3.4-1.2,4.9c7.2,12.2,2.8,28-9.4,35.2s-28,2.8-35.2-9.4c-0.8-1.5-3.3-1.8-4.9-0.8s-2.1,3.4-1.2,4.9c9.3,15.6,28.2,21,43.8,11.7S158.6,43.1,149.3,27.5z" fill="url(#logoGradientPurple)"/>
        <path d="M165.4,18.3c-0.6-1-2.2-1.2-3.2-0.6s-1.4,2.2-0.8,3.2c12.3,21,5,46.1-16,58.4c-21,12.3-46.1,5-58.4-16c-0.6-1-2.2-1.2-3.2-0.6s-1.4,2.2-0.8,3.2c14.2,24.5,43.1,31.9,67.6,17.7C174.4,70.3,181.8,41.3,165.4,18.3z" fill="url(#logoGradientPurple)" />
        
        {/* Dots */}
        <circle cx="158" cy="12" r="4" fill="url(#logoGradientPurple)" />
        <circle cx="169" cy="20" r="2.5" fill="url(#logoGradientPurple)" />

        {/* Text */}
        <text x="125" y="130" fontFamily="Arial, sans-serif" fontSize="40" fontWeight="bold" fill="url(#logoGradientPurple)" textAnchor="middle">
        livego
        </text>
    </g>
  </svg>
);
