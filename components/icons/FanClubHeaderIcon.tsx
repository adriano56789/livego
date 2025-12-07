import React from 'react';

export const FanClubHeaderIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="fanClubPinkV2" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#FF75B5"/>
        <stop offset="1" stopColor="#E43A7F"/>
      </linearGradient>
    </defs>
    <rect width="40" height="40" rx="12" fill="url(#fanClubPinkV2)"/>
    
    <path d="M31 11.5L32.5 10L34 11.5L35.5 10L37 11.5L35.5 13L37 14.5L35.5 16L34 14.5L32.5 16L31 14.5L29.5 16L28 14.5L29.5 13L28 11.5L29.5 10L31 11.5Z" fill="white" fillOpacity="0.3"/>
    <path d="M8 29L9 28L10 29L11 28L12 29L11 30L12 31L11 32L10 31L9 32L8 31L7 32L6 31L7 30L6 29L7 28L8 29Z" fill="white" fillOpacity="0.2"/>
    
    {/* This circle provides a solid background for the heart, preventing the parent background from "leaking" in. */}
    <circle cx="20.5" cy="20.5" r="11" fill="#E43A7F"/>

    <path transform="translate(7.5, 9) scale(1.2)" fill="white" d="M10.83,3.37C9.3,1.85,7.2,1.5,5.3,2.6C3.4,3.7,2.5,5.8,3,7.7c0.5,2,2.3,3.7,4.1,5.3c1,0.9,2,1.8,3,2.6c0.9-0.8,1.9-1.6,2.8-2.5c1.8-1.6,3.6-3.3,4.1-5.3c0.5-1.9-0.4-4-2.3-5.1c-1.9-1.1-4-0.8-5.5,0.7L11.5,4.7L10.83,3.37z"/>
    
    {/* Changed stroke to white to be visible on the new pink circle background */}
    <path d="M18.5 20.5H22.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <path d="M20.5 18.5V22.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);