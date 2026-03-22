import React from 'react';

interface VolumeUpIconProps {
  className?: string;
}

const VolumeUpIcon: React.FC<VolumeUpIconProps> = ({ className = '' }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 9v6h4l5 4v-6H3zm7.5 0a1 1 0 011 1v6a1 1 0 01-1h4a1 1 0 011-1V9a1 1 0 011-1z" fill="currentColor"/>
    <path d="M14.5 0a1 1 0 011 1v6a1 1 0 01-1h4a1 1 0 011-1V9a1 1 0 011-1z" fill="currentColor"/>
  </svg>
);

export default VolumeUpIcon;
