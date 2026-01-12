
import React from 'react';

export const FrameBlazingSunIcon = (props: any) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className}>
    <defs>
      <radialGradient id="sunGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(50 50) rotate(90) scale(50)">
        <stop stopColor="#FDB813" />
        <stop offset="1" stopColor="#F59E0B" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="48" stroke="url(#sunGrad)" strokeWidth="4" strokeDasharray="4 2" />
    <circle cx="50" cy="50" r="52" stroke="#EF4444" strokeWidth="2" strokeOpacity="0.5" />
    <path d="M50 0 L55 10 L50 20 L45 10 Z" fill="#F59E0B" />
    <path d="M50 100 L55 90 L50 80 L45 90 Z" fill="#F59E0B" />
    <path d="M0 50 L10 55 L20 50 L10 45 Z" fill="#F59E0B" />
    <path d="M100 50 L90 55 L80 50 L90 45 Z" fill="#F59E0B" />
  </svg>
);
