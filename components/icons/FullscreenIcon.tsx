import React from 'react';

interface FullscreenIconProps {
  className?: string;
}

const FullscreenIcon: React.FC<FullscreenIconProps> = ({ className = '' }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 14H5a5 5 0 005 5v2a5 5 0 005-5h2a5 5 0 005 5v2a5 5 0 005-5H7zm0 0h2a5 5 0 005 5v2a5 5 0 005-5H2zm0 4h2a5 5 0 005 5v2a5 5 0 005-5H2zm0 8h2a5 5 0 005 5v2a5 5 0 005-5H2z" fill="currentColor"/>
  </svg>
);

export default FullscreenIcon;
