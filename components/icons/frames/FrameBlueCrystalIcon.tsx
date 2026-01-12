
import React from 'react';

export const FrameBlueCrystalIcon = (props: any) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className}>
    <defs>
      <linearGradient id="crystalGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60A5FA" />
        <stop offset="1" stopColor="#2563EB" />
      </linearGradient>
    </defs>
    <path d="M50 5 L95 25 L95 75 L50 95 L5 75 L5 25 Z" stroke="url(#crystalGrad)" strokeWidth="4" fill="none" />
    <circle cx="50" cy="5" r="4" fill="#93C5FD" />
    <circle cx="95" cy="25" r="4" fill="#93C5FD" />
    <circle cx="95" cy="75" r="4" fill="#93C5FD" />
    <circle cx="50" cy="95" r="4" fill="#93C5FD" />
    <circle cx="5" cy="75" r="4" fill="#93C5FD" />
    <circle cx="5" cy="25" r="4" fill="#93C5FD" />
  </svg>
);
