import React from 'react';

const EloIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" {...props}>
    <g fill="none" fillRule="evenodd">
      <path fill="#292929" d="M41 48H7a7 7 0 01-7-7V7a7 7 0 017-7h34a7 7 0 017 7v34a7 7 0 01-7 7z" />
      <path fill="#F7B600" d="M19.3 15.6a3.8 3.8 0 100 7.6 3.8 3.8 0 000-7.6zm-1.8 3.8c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8-.8 1.8-1.8 1.8-1.8-.8-1.8-1.8z" />
      <path fill="#F7B600" d="M28.4 15.6h-5.2v7.6h5.2v-1.5h-3.4v-1.7h3.4v-1.5h-3.4v-1.5h3.4v-1.4zM36.4 15.6h-5.2v7.6h5.2v-1.5h-3.4v-1.7h3.4v-1.5h-3.4v-1.5h3.4v-1.4z" />
      <circle cx="19.3" cy="32.4" r="3.8" fill="#FFF" />
      <circle cx="28.7" cy="32.4" r="3.8" fill="#00A4E0" />
      <circle cx="38.1" cy="32.4" r="3.8" fill="#E61A23" />
    </g>
  </svg>
);

export default EloIcon;
