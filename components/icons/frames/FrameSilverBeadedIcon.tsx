
import React from 'react';

export const FrameSilverBeadedIcon = (props: any) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className}>
    <circle cx="50" cy="50" r="45" stroke="#94A3B8" strokeWidth="1" />
    {Array.from({ length: 12 }).map((_, i) => (
      <circle 
        key={i} 
        cx={50 + 48 * Math.cos((i * 30 * Math.PI) / 180)} 
        cy={50 + 48 * Math.sin((i * 30 * Math.PI) / 180)} 
        r="3" 
        fill="#CBD5E1" 
      />
    ))}
  </svg>
);
