
import React from 'react';

const VideoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v14.25C1.5 20.16 2.34 21 3.375 21H20.625c1.035 0 1.875-.84 1.875-1.875V4.875C22.5 3.839 21.66 3 20.625 3H3.375zM9 15.75V8.25a.75.75 0 011.125-.67l5.25 3.75a.75.75 0 010 1.34l-5.25 3.75A.75.75 0 019 15.75z" />
  </svg>
);

export default VideoIcon;