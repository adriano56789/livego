
import React from 'react';

const LinkedCirclesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="grad-pink" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F472B6" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>
      <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
      <mask id="mask-circle-left">
        <rect width="48" height="48" fill="white" />
        <circle cx="30" cy="24" r="10" fill="black" />
      </mask>
      <mask id="mask-circle-right">
        <rect width="48" height="48" fill="white" />
        <circle cx="18" cy="24" r="10" fill="black" />
      </mask>
    </defs>
    <circle cx="18" cy="24" r="10" stroke="url(#grad-pink)" strokeWidth="5" mask="url(#mask-circle-left)" />
    <circle cx="30" cy="24" r="10" stroke="url(#grad-blue)" strokeWidth="5" mask="url(#mask-circle-right)" />
  </svg>
);

export default LinkedCirclesIcon;
