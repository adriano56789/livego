
import React from 'react';

const GroupIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="grad-group-pink" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F472B6" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>
      <linearGradient id="grad-group-blue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
    
    {/* Left Person */}
    <path d="M22 24C22 20.6863 19.3137 18 16 18C12.6863 18 10 20.6863 10 24V28C10 30.2091 11.7909 32 14 32H18C20.2091 32 22 30.2091 22 28V24Z" stroke="url(#grad-group-pink)" strokeWidth="3" />
    <circle cx="16" cy="14" r="4" stroke="url(#grad-group-pink)" strokeWidth="3" />

    {/* Right Person */}
    <path d="M38 24C38 20.6863 35.3137 18 32 18C28.6863 18 26 20.6863 26 24V28C26 30.2091 27.7909 32 30 32H34C36.2091 32 38 30.2091 38 28V24Z" stroke="url(#grad-group-blue)" strokeWidth="3" />
    <circle cx="32" cy="14" r="4" stroke="url(#grad-group-blue)" strokeWidth="3" />
  </svg>
);

export default GroupIcon;
