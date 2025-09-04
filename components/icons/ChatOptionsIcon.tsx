
import React from 'react';

const ChatOptionsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
    <line x1="7" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="2"/>
    <line x1="7" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export default ChatOptionsIcon;
