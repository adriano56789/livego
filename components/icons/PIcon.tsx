import React from 'react';

interface PIconProps {
  className?: string;
}

export const PIcon: React.FC<PIconProps> = ({ className = '' }) => {
  console.log('PIcon está sendo renderizado');
  return (
  <div 
    className={`flex items-center justify-center w-5 h-5 bg-purple-500 rounded-full text-white font-bold text-xs flex-shrink-0 border border-white/50 shadow-md ${className}`}
    style={{
      boxShadow: '0 0 5px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255, 255, 255, 0.5)'
    }}
  >
    P
  </div>
  );
}
