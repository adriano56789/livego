import React from 'react';

export const FrameBlueCrystalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="50" cy="50" r="40" stroke="#4338ca" strokeWidth="4" />
        {/* Static Stars */}
        <circle cx="50" cy="10" r="2" fill="white" />
        <circle cx="20" cy="25" r="1.5" fill="white" />
        <circle cx="80" cy="75" r="1.5" fill="white" />
        <circle cx="30" cy="80" r="1" fill="white" />
        <circle cx="70" cy="20" r="1" fill="white" />
        {/* Animated Twinkling Stars */}
        <circle cx="85" cy="50" r="2.5" fill="white" style={{ animation: `starlight-anim-opacity 3s infinite ${Math.random() * 3}s` }} />
        <circle cx="15" cy="50" r="2" fill="white" style={{ animation: `starlight-anim-opacity 4s infinite ${Math.random() * 4}s` }} />
        <circle cx="50" cy="90" r="2" fill="white" style={{ animation: `starlight-anim-opacity 5s infinite ${Math.random() * 5}s` }} />
    </svg>
);