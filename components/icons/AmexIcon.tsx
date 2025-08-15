import React from 'react';

const AmexIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" {...props}>
    <path fill="#0077C8" d="M41 48H7a7 7 0 01-7-7V7a7 7 0 017-7h34a7 7 0 017 7v34a7 7 0 01-7 7z"/>
    <path fill="#FFF" d="M21 21.2h6.8l-1.1 4.5H21v-4.5zM12.9 12.3H18l-1.3 5.4h-5.9L12.9 12.3zm12.3 5.4h5.9l-2.1-8.5h-5.1l1.3 3.1zM24 12.3h5.1L30.4 9H24v3.3zm-5.2-3.3h-5.1l1.3-5.4h5.1l-1.3 5.4zm-1.3 16.7h-6l2.2 8.9h6l-2.2-8.9zM24 34.6h-5.1l-2.2-8.9h5.1l2.2 8.9zm5.2 0h5.1l2.2-8.9h-5.1l-2.2 8.9zm1.3-13.4h5.9l2.2-8.9h-5.9l-2.2 8.9z"/>
  </svg>
);

export default AmexIcon;
