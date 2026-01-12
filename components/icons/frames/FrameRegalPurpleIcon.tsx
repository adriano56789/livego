
import React from 'react';

export const FrameRegalPurpleIcon = (props: any) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className}>
    <defs>
      <linearGradient id="regalGrad" x1="0" y1="0" x2="100" y2="100">
        <stop stopColor="#6B21A8" />
        <stop offset="1" stopColor="#3B0764" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="46" stroke="url(#regalGrad)" strokeWidth="6" />
    <path d="M50 0 L60 12 L50 24 L40 12 Z" fill="#F59E0B" />
    <circle cx="50" cy="94" r="6" fill="#F59E0B" />
    <circle cx="6" cy="50" r="6" fill="#F59E0B" />
    <circle cx="94" cy="50" r="6" fill="#F59E0B" />
  </svg>
);
