
import React from 'react';

const PkBlobsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="blob-pink-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F9A8D4" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>
      <linearGradient id="blob-blue-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#93C5FD" />
        <stop offset="100%" stopColor="#60A5FA" />
      </linearGradient>
    </defs>
    <circle cx="20" cy="20" r="16" fill="url(#blob-pink-grad)" opacity="0.8" />
    <circle cx="40" cy="20" r="16" fill="url(#blob-blue-grad)" opacity="0.8" />
  </svg>
);

export default PkBlobsIcon;
