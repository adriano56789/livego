import React from 'react';

const LionKingIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    {/* Mane */}
    <circle cx="50" cy="50" r="40" fill="brown" />
    {/* Face */}
    <circle cx="50" cy="50" r="30" fill="orange" />
    {/* Eyes */}
    <circle cx="40" cy="40" r="5" fill="black" />
    <circle cx="60" cy="40" r="5" fill="black" />
    {/* Nose */}
    <path d="M 45 55 L 55 55 L 50 65 Z" fill="black" />
    {/* Crown */}
    <path d="M 30 20 L 40 30 L 50 20 L 60 30 L 70 20 L 70 35 L 30 35 Z" fill="gold" />
  </svg>
);

export default LionKingIcon;