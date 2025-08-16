import React from 'react';

const LevelBarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="2" y="3" width="1.5" height="6" rx="0.75" fill="currentColor"/>
    <rect x="5.25" y="3" width="1.5" height="6" rx="0.75" fill="currentColor"/>
    <rect x="8.5" y="3" width="1.5" height="6" rx="0.75" fill="currentColor" opacity="0.3"/>
  </svg>
);

export default LevelBarIcon;