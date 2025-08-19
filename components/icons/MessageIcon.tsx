
import React from 'react';

const MessageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75c.995 0 1.954-.146 2.865-.421a.75.75 0 01.444.257l2.124 2.124a.75.75 0 001.06-1.06l-2.123-2.123a.75.75 0 01-.258-.445A9.704 9.704 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75zm-3.75 7.5a.75.75 0 000 1.5h7.5a.75.75 0 000-1.5h-7.5z" clipRule="evenodd" />
  </svg>
);

export default MessageIcon;