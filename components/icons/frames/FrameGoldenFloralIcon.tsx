
import React from 'react';

export const FrameGoldenFloralIcon = (props: any) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className}>
    <defs>
      <linearGradient id="gold" x1="0" y1="0" x2="100" y2="100">
        <stop stopColor="#FCD34D" />
        <stop offset="1" stopColor="#B45309" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="47" stroke="url(#gold)" strokeWidth="4" />
    <path d="M50 0 L60 10 L50 20 L40 10 Z" fill="url(#gold)" />
    <path d="M50 100 L40 90 L50 80 L60 90 Z" fill="url(#gold)" />
    <circle cx="10" cy="50" r="4" fill="#F59E0B" />
    <circle cx="90" cy="50" r="4" fill="#F59E0B" />
  </svg>
);
