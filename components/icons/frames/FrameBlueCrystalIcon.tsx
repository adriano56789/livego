import React from 'react';

export const FrameBlueCrystalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="gradBlueCrystalFrame" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#4f46e5"/>
        <stop offset="100%" stopColor="#7c3aed"/>
      </linearGradient>
      <linearGradient id="gradBlueCrystal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#a5b4fc"/>
        <stop offset="100%" stopColor="#6366f1"/>
      </linearGradient>
      <filter id="crystalGlow">
        <feGaussianBlur stdDeviation="1" in="SourceGraphic" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Base Ring */}
    <g filter="url(#crystalGlow)">
      <circle cx="50" cy="50" r="40" stroke="url(#gradBlueCrystalFrame)" strokeWidth="3" />
       {[...Array(12)].map((_, i) => (
        <path key={i} d={`M50,10 L52,12 L50,14 L48,12 Z`} transform={`rotate(${i * 30} 50 50)`} fill="#a78bfa" />
       ))}
    </g>
    {/* Top Crystal */}
    <g transform="translate(80, 20) rotate(45)">
        <path d="M0,0 L10,-10 L20,0 L10,10 Z" fill="url(#gradBlueCrystal)" />
        <path d="M0,0 L10,-10 L10,10 Z" fill="#c7d2fe"/>
    </g>
    {/* Bottom Crystal */}
    <g transform="translate(30, 85) rotate(15)">
        <path d="M0,0 L8,-8 L16,0 L8,8 Z" fill="url(#gradBlueCrystal)" />
        <path d="M0,0 L8,-8 L8,8 Z" fill="#c7d2fe"/>
    </g>
  </svg>
);