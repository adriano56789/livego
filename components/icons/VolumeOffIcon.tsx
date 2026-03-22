import React from 'react';

interface VolumeOffIconProps {
  className?: string;
}

const VolumeOffIcon: React.FC<VolumeOffIconProps> = ({ className = '' }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.889 16H3a4 4 0 004 4v6a4 4 0 004-4h1.172l-3.172-3.172z" fill="currentColor"/>
    <path d="M1 9a1 1 0 011-1v6a1 1 0 01-1h5a1 1 0 011 1v6a1 1 0 01-1H1z" fill="currentColor"/>
    <path d="M10 9a1 1 0 011-1v6a1 1 0 01-1h5a1 1 0 011 1v6a1 1 0 01-1h-5a1 1 0 01-1z" fill="currentColor"/>
    <path d="M18 9a1 1 0 011-1v6a1 1 0 01-1h5a1 1 0 011 1v6a1 1 0 01-1h-5a1 1 0 01-1z" fill="currentColor"/>
  </svg>
);

export default VolumeOffIcon;
