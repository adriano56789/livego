import React from 'react';

const SwordsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <defs>
      <linearGradient id="swords-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
    </defs>
    <path fill="url(#swords-grad)" d="M16.38 1.15a1.53 1.53 0 012.1 0l4.37 4.37a1.53 1.53 0 010 2.1L12.1 18.38a1.53 1.53 0 01-2.1 0L1.15 7.62a1.53 1.53 0 010-2.1l4.37-4.37a1.53 1.53 0 012.1 0l2.13 2.12 4.51-4.51L16.38 1.15zM7.62 22.85a1.53 1.53 0 01-2.1 0l-4.37-4.37a1.53 1.53 0 010-2.1l10.75-10.76a1.53 1.53 0 012.1 0l4.37 4.37a1.53 1.53 0 010 2.1L11.88 22.85a1.53 1.53 0 01-2.1 0l-2.13-2.12-4.51 4.51L7.62 22.85z" />
  </svg>
);

export default SwordsIcon;