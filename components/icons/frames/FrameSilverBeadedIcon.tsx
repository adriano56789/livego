import React from 'react';
export const FrameSilverBeadedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="gradSilverBeaded" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f9fafb" />
        <stop offset="100%" stopColor="#9ca3af" />
      </linearGradient>
      <radialGradient id="gradBead" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#581c87" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="42" stroke="#6b7280" strokeWidth="2" />
    <circle cx="50" cy="50" r="34" fill="url(#gradSilverBeaded)" />
    {[...Array(36)].map((_, i) => (
      <circle key={i} cx="50" cy="12" r="1.5" fill="url(#gradBead)" transform={`rotate(${i * 10} 50 50)`} />
    ))}
    {/* Diamonds */}
    {[...Array(4)].map((_, i) => (
      <g key={i} transform={`rotate(${i * 90} 50 50)`}>
        <path d="M50 4 L 60 18 L 50 24 L 40 18 Z" fill="#e0f2fe" stroke="#93c5fd" strokeWidth="0.5" />
      </g>
    ))}
  </svg>
);