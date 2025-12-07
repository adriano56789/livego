import React from 'react';

export const FrameRoseHeartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="gradRoseGold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fcd34d" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
      <radialGradient id="gradRoseRed" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fb7185" />
        <stop offset="100%" stopColor="#e11d48" />
      </radialGradient>
      <radialGradient id="gradRosePurple" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#9333ea" />
      </radialGradient>
      <linearGradient id="gradHeartPurple" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#6d28d9" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="38" stroke="url(#gradRoseGold)" strokeWidth="4"/>
    {/* Top Right Flowers */}
    <circle cx="75" cy="25" r="8" fill="url(#gradRoseRed)" />
    <circle cx="85" cy="40" r="6" fill="url(#gradRosePurple)" />
    {/* Top Left Flowers */}
    <circle cx="25" cy="25" r="8" fill="url(#gradRoseRed)" />
    <circle cx="15" cy="40" r="6" fill="url(#gradRosePurple)" />
    {/* Bottom Wreath */}
    <path d="M20 70 C 30 90, 70 90, 80 70" stroke="#166534" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <circle cx="25" cy="75" r="5" fill="url(#gradRosePurple)" />
    <circle cx="75" cy="75" r="5" fill="url(#gradRoseRed)" />
    {/* Heart */}
    <path d="M50 78 C 40 70, 40 60, 50 68 C 60 60, 60 70, 50 78" fill="url(#gradHeartPurple)" />
    <path d="M50 78 C 45 72, 45 64, 50 70" fill="#c084fc" />
  </svg>
);