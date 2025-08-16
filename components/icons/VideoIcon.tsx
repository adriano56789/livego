import React from 'react';

// Modern video camera icon with a play symbol inside, inspired by user feedback.
const VideoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18 10.48V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4.48l4 4V6.48l-4 4zM10 15V9l4.5 3-4.5 3z"/>
  </svg>
);

export default VideoIcon;
