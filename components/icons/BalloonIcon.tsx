
import React from 'react';

const BalloonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g transform="translate(-2, -2)">
        <path d="M14.5 20.0333C14.5 21.2167 15.06 22 16 22C16.94 22 17.5 21.2167 17.5 20.0333C17.5 18.85 16.94 18.1667 16 18.1667C15.06 18.1667 14.5 18.85 14.5 20.0333Z" fill="#4C82FB"/>
        <path d="M12.1667 16.5C12.1667 17.6833 12.7267 18.5 13.6667 18.5C14.6067 18.5 15.1667 17.6833 15.1667 16.5C15.1667 15.3167 14.6067 14.5 13.6667 14.5C12.7267 14.5 12.1667 15.3167 12.1667 16.5Z" fill="#F44336"/>
    </g>
  </svg>
);

export default BalloonIcon;
