import React from 'react';

const MoreToolsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" {...props}>
    <circle cx="50" cy="50" r="50" fill="black"/>
    <circle cx="30" cy="50" r="5" fill="white"/>
    <circle cx="50" cy="50" r="5" fill="white"/>
    <circle cx="70" cy="50" r="5" fill="white"/>
  </svg>
);

export default MoreToolsIcon;
