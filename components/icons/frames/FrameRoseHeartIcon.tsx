
import React from 'react';

export const FrameRoseHeartIcon = (props: any) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className}>
    <circle cx="50" cy="50" r="46" stroke="#FB7185" strokeWidth="2" />
    <path d="M50 15 C60 5 70 15 50 25 C30 15 40 5 50 15" fill="#E11D48" />
    <path d="M50 95 C60 85 70 95 50 100 C30 95 40 85 50 95" fill="#E11D48" transform="rotate(180 50 95)" />
    <circle cx="10" cy="50" r="5" fill="#FDA4AF" />
    <circle cx="90" cy="50" r="5" fill="#FDA4AF" />
  </svg>
);
