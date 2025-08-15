
import React from 'react';

const PixIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="128" height="128" rx="24" fill="#222"/>
    <path d="M110.833 64C110.833 38.625 91.375 17.1667 66 17.1667H29.1667V110.833H66C91.375 110.833 110.833 89.375 110.833 64Z" fill="white"/>
    <path d="M47.6667 41.3333V86.6667H58V69.5H68.8333C77.4167 69.5 83.5 75.5833 83.5 81.3333C83.5 87.0833 77.4167 92 68.8333 92H58V103.167H69.5C83.5 103.167 94.1667 92.5 94.1667 81.3333C94.1667 70.1667 83.5 58.8333 69.5 58.8333H58V41.3333H47.6667Z" fill="#32BCAD"/>
  </svg>
);

export default PixIcon;
