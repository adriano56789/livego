
import React from 'react';

const SuccessIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="25" cy="25" r="25" fill="#34C759" />
    <path d="M14 25.5L21 32.5L36 17.5" stroke="black" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default SuccessIcon;
