
import React from 'react';

export const FrameDiamondIcon = (props: any) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className}>
    <circle cx="50" cy="50" r="48" stroke="#E2E8F0" strokeWidth="3" />
    <path d="M50 0 L55 8 L50 16 L45 8 Z" fill="#38BDF8" />
    <path d="M100 50 L92 55 L84 50 L92 45 Z" fill="#38BDF8" />
    <path d="M50 100 L45 92 L50 84 L55 92 Z" fill="#38BDF8" />
    <path d="M0 50 L8 45 L16 50 L8 55 Z" fill="#38BDF8" />
    <circle cx="50" cy="50" r="50" stroke="url(#diamondGrad)" strokeWidth="1" />
    <defs>
      <linearGradient id="diamondGrad" x1="0" y1="0" x2="100" y2="100">
        <stop stopColor="#E0F2FE" />
        <stop offset="1" stopColor="#0EA5E9" />
      </linearGradient>
    </defs>
  </svg>
);
