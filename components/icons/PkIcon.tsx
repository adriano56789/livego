import React from 'react';

const PkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="pk-grad-blue" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#2563EB" />
      </linearGradient>
      <linearGradient id="pk-grad-pink" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#EC4899" />
        <stop offset="100%" stopColor="#DB2777" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="#1E3A8A"/>
    <path d="M32 2 A 30 30 0 0 1 32 62" fill="url(#pk-grad-pink)"/>
    <path d="M32 2 A 30 30 0 0 0 32 62" fill="url(#pk-grad-blue)"/>
    <circle cx="32" cy="32" r="24" fill="#1E40AF" stroke="#BFDBFE" strokeWidth="1"/>
    <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="24" fontWeight="bold" fill="white" stroke="#000" strokeWidth="0.5" strokeLinejoin="round">
      PK
    </text>
  </svg>
);

export default PkIcon;
