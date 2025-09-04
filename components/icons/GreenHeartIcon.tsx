
import React from 'react';

const GreenHeartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="12" cy="12" r="12" fill="#4ADE80" fillOpacity="0.3"/>
    <path d="M16.5 6.5C14.76 4.5 12 5.5 12 7.5C12 5.5 9.24 4.5 7.5 6.5C5.5 8.5 7.5 12.5 12 16.5C16.5 12.5 18.5 8.5 16.5 6.5Z" fill="#4ADE80"/>
  </svg>
);

export default GreenHeartIcon;
