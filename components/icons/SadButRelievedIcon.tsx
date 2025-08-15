
import React from 'react';

const SadButRelievedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" {...props}>
    <circle cx="10" cy="10" r="9" fill="#FBBF24" />
    <path d="M10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10C18 14.4183 14.4183 18 10 18Z" fill="#FDE047" stroke="#F59E0B" strokeWidth="1.5"/>
    <path d="M14 13.5C13.5 13 12.6667 12.5 10 12.5C7.33333 12.5 6.5 13 6 13.5" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round"/>
    <ellipse cx="7" cy="9" rx="1" ry="1.5" fill="#6B3A03"/>
    <ellipse cx="13" cy="9" rx="1" ry="1.5" fill="#6B3A03"/>
    <path d="M15 6.5C15.5 5.5 15.5 4.5 15 4" stroke="#46C2EF" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default SadButRelievedIcon;
