import React from 'react';

const JackInTheBoxIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    {/* Spring */}
    <path d="M 50 60 C 40 55, 60 50, 50 45 C 40 40, 60 35, 50 30" stroke="gray" strokeWidth="4" fill="none" />
    {/* Head */}
    <circle cx="50" cy="20" r="15" fill="yellow" />
    <circle cx="45" cy="18" r="3" fill="black" />
    <circle cx="55" cy="18" r="3" fill="black" />
    <path d="M 45 25 Q 50 30, 55 25" stroke="black" strokeWidth="2" fill="none" />
    {/* Box */}
    <rect x="25" y="60" width="50" height="30" fill="red" />
    <circle cx="35" cy="75" r="5" fill="blue" />
    <circle cx="65" cy="75" r="5" fill="green" />
  </svg>
);

export default JackInTheBoxIcon;