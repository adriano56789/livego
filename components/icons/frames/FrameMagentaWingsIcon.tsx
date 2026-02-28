import React from 'react';
export const FrameMagentaWingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="gradMagentaWings" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f472b6" />
        <stop offset="100%" stopColor="#d946ef" />
      </linearGradient>
      <linearGradient id="gradDiamondMagenta" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f5d0fe"/>
        <stop offset="100%" stopColor="#c084fc"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="35" stroke="#ec4899" strokeWidth="5" />
    {/* Top Diamond */}
    <path d="M50 5 L 60 18 L 50 22 L 40 18 Z" fill="url(#gradDiamondMagenta)" />
    {/* Bottom Diamond */}
    <path d="M50 95 L 55 88 L 50 85 L 45 88 Z" fill="url(#gradDiamondMagenta)" />
    {/* Wings */}
    <g transform="translate(10 50)">
      <path d="M0,0 C 10,-15 20,-15 30,-5" stroke="url(#gradMagentaWings)" strokeWidth="3" fill="none" />
      <path d="M0,0 C 10,15 20,15 30,5" stroke="url(#gradMagentaWings)" strokeWidth="3" fill="none" />
      <path d="M5,-5 C 12,-20 22,-20 32,-8" stroke="#f9a8d4" strokeWidth="1.5" fill="none" />
      <path d="M5,5 C 12,20 22,20 32,8" stroke="#f9a8d4" strokeWidth="1.5" fill="none" />
    </g>
    <g transform="translate(90 50) scale(-1, 1)">
      <path d="M0,0 C 10,-15 20,-15 30,-5" stroke="url(#gradMagentaWings)" strokeWidth="3" fill="none" />
      <path d="M0,0 C 10,15 20,15 30,5" stroke="url(#gradMagentaWings)" strokeWidth="3" fill="none" />
      <path d="M5,-5 C 12,-20 22,-20 32,-8" stroke="#f9a8d4" strokeWidth="1.5" fill="none" />
      <path d="M5,5 C 12,20 22,20 32,8" stroke="#f9a8d4" strokeWidth="1.5" fill="none" />
    </g>
  </svg>
);