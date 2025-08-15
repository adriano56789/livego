
import React from 'react';

const ChatBubbleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.722.28c-1.28.096-2.457.69-3.286 1.625a4.5 4.5 0 01-6.502 0V21H4.5a2.25 2.25 0 01-2.25-2.25v-13.5A2.25 2.25 0 014.5 3h11.25a2.25 2.25 0 012.25 2.25v1.655Z" />
  </svg>
);

export default ChatBubbleIcon;
