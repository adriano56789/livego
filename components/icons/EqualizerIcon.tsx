import React from 'react';

const EqualizerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M3 13V5C3 4.44772 3.44772 4 4 4C4.55228 4 5 4.44772 5 5V13C5 13.5523 4.55228 14 4 14C3.44772 14 3 13.5523 3 13Z" fill="white"/>
    <path d="M8 15V3C8 2.44772 8.44772 2 9 2C9.55228 2 10 2.44772 10 3V15C10 15.5523 9.55228 16 9 16C8.44772 16 8 15.5523 8 15Z" fill="white"/>
    <path d="M13 11V7C13 6.44772 13.4477 6 14 6C14.5523 6 15 6.44772 15 7V11C15 11.5523 14.5523 12 14 12C13.4477 12 13 11.5523 13 11Z" fill="white"/>
  </svg>
);

export default EqualizerIcon;
