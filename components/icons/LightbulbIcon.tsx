
import React from 'react';

const LightbulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6z" />
    <path fillRule="evenodd" d="M16.707 5.293a.75.75 0 010 1.06l-.75.75a.75.75 0 11-1.06-1.06l.75-.75a.75.75 0 011.06 0zM4.354 14.586a.75.75 0 000-1.06l-.75-.75a.75.75 0 00-1.06 1.06l.75.75a.75.75 0 001.06 0z" clipRule="evenodd" />
    <path d="M3.293 5.293a.75.75 0 011.06 0l.75.75a.75.75 0 01-1.06 1.06l-.75-.75a.75.75 0 010-1.06zM15.646 14.586a.75.75 0 00-1.06 0l-.75.75a.75.75 0 001.06 1.06l.75-.75a.75.75 0 000-1.06z" />
  </svg>
);

export default LightbulbIcon;
