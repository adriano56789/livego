

import React from 'react';

const MessageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.252 0 9.75-3.694 9.75-8.25s-4.498-8.25-9.75-8.25S3 7.694 3 12.25c0 1.801.523 3.514 1.424 4.965.246.388.452.817.614 1.282zM6.38 16.36a.75.75 0 01-.22-.531v-1.63a.75.75 0 011.498-.055l.002.055v1.63a.75.75 0 01-.278.586l.278-.586a.75.75 0 011.058.42l1.06 2.12a.75.75 0 01-.42 1.058l-2.12 1.06a.75.75 0 01-1.058-.42l-1.06-2.12z" clipRule="evenodd" />
  </svg>
);

export default MessageIcon;