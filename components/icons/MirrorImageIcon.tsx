
import React from 'react';

const MirrorImageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v3m0 0l-3-3m3 3l3-3m2.25 3v6a2.25 2.25 0 01-2.25 2.25H6.75a2.25 2.25 0 01-2.25-2.25v-6a2.25 2.25 0 012.25-2.25H17.25a2.25 2.25 0 012.25 2.25z" transform="rotate(90 12 12)" />
  </svg>
);

export default MirrorImageIcon;
