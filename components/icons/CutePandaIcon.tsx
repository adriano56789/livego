import React from 'react';

const CutePandaIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g>
      {/* Head */}
      <circle cx="50" cy="50" r="35" fill="white" stroke="black" strokeWidth="2" />
      {/* Ears */}
      <circle cx="25" cy="25" r="12" fill="black" />
      <circle cx="75" cy="25" r="12" fill="black" />
      {/* Eye Patches */}
      <ellipse cx="38" cy="48" rx="10" ry="14" fill="black" />
      <ellipse cx="62" cy="48" rx="10" ry="14" fill="black" />
      {/* Eyes */}
      <circle cx="38" cy="48" r="4" fill="white" />
      <circle cx="62" cy="48" r="4" fill="white" />
      {/* Nose and Mouth */}
      <path d="M 45 62 Q 50 68, 55 62" fill="black" />
    </g>
  </svg>
);

export default CutePandaIcon;