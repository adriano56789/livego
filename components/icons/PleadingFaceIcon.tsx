
import React from 'react';

const PleadingFaceIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" {...props}>
    <circle cx="10" cy="10" r="9" fill="#FBBF24" />
    <path d="M10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10C18 14.4183 14.4183 18 10 18Z" fill="#FDE047" stroke="#F59E0B" strokeWidth="1.5"/>
    <path d="M13.5 13C13.5 13 12.5 14.5 10 14.5C7.5 14.5 6.5 13 6.5 13" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round"/>
    <ellipse cx="6.5" cy="8.5" rx="1.5" ry="2" fill="#6B3A03"/>
    <ellipse cx="13.5" cy="8.5" rx="1.5" ry="2" fill="#6B3A03"/>
    <path d="M5.5 8C5.70181 7.47454 6.08453 7.10181 6.5 7" stroke="white" strokeWidth="0.5" strokeLinecap="round" strokeOpacity="0.5"/>
    <path d="M12.5 8C12.7018 7.47454 13.0845 7.10181 13.5 7" stroke="white" strokeWidth="0.5" strokeLinecap="round" strokeOpacity="0.5"/>
    <path d="M15 5L16 3" stroke="#A16207" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M5 5L4 3" stroke="#A16207" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default PleadingFaceIcon;
