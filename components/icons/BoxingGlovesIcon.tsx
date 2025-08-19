
import React from 'react';

const BoxingGlovesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <filter id="neon-glow-pink-gloves" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
       <filter id="neon-glow-blue-gloves" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g transform="rotate(-10 24 24)">
      <path d="M22 17C22 14.7909 20.2091 13 18 13C15.7909 13 14 14.7909 14 17V26H22V17Z" stroke="#EC4899" strokeWidth="3" filter="url(#neon-glow-pink-gloves)"/>
      <path d="M22 26C22 29.3137 19.3137 32 16 32C12.6863 32 10 29.3137 10 26C10 22.6863 12.6863 20 16 20H22V26Z" stroke="#EC4899" strokeWidth="3" filter="url(#neon-glow-pink-gloves)"/>
    </g>
    <g transform="rotate(10 24 24) scale(-1, 1) translate(-48, 0)">
      <path d="M22 17C22 14.7909 20.2091 13 18 13C15.7909 13 14 14.7909 14 17V26H22V17Z" stroke="#3B82F6" strokeWidth="3" filter="url(#neon-glow-blue-gloves)"/>
      <path d="M22 26C22 29.3137 19.3137 32 16 32C12.6863 32 10 29.3137 10 26C10 22.6863 12.6863 20 16 20H22V26Z" stroke="#3B82F6" strokeWidth="3" filter="url(#neon-glow-blue-gloves)"/>
    </g>
  </svg>
);

export default BoxingGlovesIcon;
