
import React from 'react';

const RotateIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.091 1.21-.138 2.43-.138 3.662a48.678 48.678 0 007.324 0 48.678 48.678 0 007.324 0zM4.5 12c0 3.314 2.686 6 6 6s6-2.686 6-6-2.686-6-6-6-6 2.686-6 6z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L19.5 12l-3.75-7.5" />
  </svg>
);

export default RotateIcon;
