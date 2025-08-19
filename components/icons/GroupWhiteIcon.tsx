
import React from 'react';

const GroupWhiteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="white" xmlns="http://www.w3.org/2000/svg" {...props}>
    {/* Back Person */}
    <g transform="translate(6, 0)">
      <circle cx="24" cy="18" r="6" />
      <path d="M24 26 C 19.5817 26, 16 29.5817, 16 34V36H32V34C32 29.5817, 28.4183 26, 24 26Z" />
    </g>
    
    {/* Front Person */}
    <g transform="translate(-6, 0)">
      <circle cx="18" cy="18" r="6" />
      <path d="M18 26 C 13.5817 26, 10 29.5817, 10 34V36H26V34C26 29.5817, 22.4183 26, 18 26Z" />
    </g>
  </svg>
);

export default GroupWhiteIcon;
