
import React from 'react';

const WaveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10 3c-4.418 0-8 2.239-8 5s3.582 5 8 5 8-2.239 8-5-3.582-5-8-5zM2 11.111C2 12.7 5.582 14 10 14s8-1.3 8-2.889V17c0 2.761-3.582 5-8 5s-8-2.239-8-5v-5.889z" clipRule="evenodd" />
  </svg>
);

export default WaveIcon;
