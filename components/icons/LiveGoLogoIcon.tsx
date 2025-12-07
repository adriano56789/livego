import React from 'react';

export const LiveGoLogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="48" height="48" rx="12" fill="url(#paint0_linear_lg_1)"/>
    <path d="M22.5 16C19.1863 16 16.5 18.6863 16.5 22V26C16.5 29.3137 19.1863 32 22.5 32" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22.5 24H22.51" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M31.5 24C31.5 20.134 28.366 17 24.5 17C20.634 17 17.5 20.134 17.5 24C17.5 27.866 20.634 31 24.5 31C28.366 31 31.5 27.866 31.5 24Z" stroke="white" strokeWidth="3"/>
    <path d="M31.5 24L34.5 21" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <path d="M31.5 24L34.5 27" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <defs>
      <linearGradient id="paint0_linear_lg_1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF6B6B"/>
        <stop offset="1" stopColor="#FF8E53"/>
      </linearGradient>
    </defs>
  </svg>
);

export default LiveGoLogoIcon;
