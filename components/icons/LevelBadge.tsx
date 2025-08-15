import React from 'react';

interface LevelBadgeProps {
  level?: number;
}

const LevelBadge: React.FC<LevelBadgeProps> = ({ level }) => {
  const CrownIcon = () => (
    <svg viewBox="0 0 12 8" fill="currentColor" className="w-2.5 h-2.5 mr-1"><path d="M0 8V6L2 4L0 2V0H4L6 3L8 0H12V2L10 4L12 6V8H8L6 5L4 8H0Z"></path></svg>
  );
  const SunIcon = () => (
    <svg viewBox="0 0 10 10" fill="currentColor" className="w-2.5 h-2.5 mr-1"><path d="M5 0L6.25 2.5L8.5 1.5L7.5 3.75L10 5L7.5 6.25L8.5 8.5L6.25 7.5L5 10L3.75 7.5L1.5 8.5L2.5 6.25L0 5L2.5 3.75L1.5 1.5L3.75 2.5L5 0Z"></path></svg>
  );
  const FlowerIcon = () => (
     <svg viewBox="0 0 10 10" fill="currentColor" className="w-2.5 h-2.5 mr-1"><path d="M5 0C2.5 2.5 0 5 0 5S2.5 7.5 5 10C7.5 7.5 10 5 10 5S7.5 2.5 5 0Z"></path></svg>
  );

  let bgColor, Icon, textColor = 'text-white';
  
  if (level === 1) { 
    bgColor = 'bg-pink-500'; 
    Icon = CrownIcon; 
  } else if (level === 2) { 
    bgColor = 'bg-orange-400'; 
    Icon = SunIcon;
  } else if (level === 3) { 
    bgColor = 'bg-yellow-400'; 
    Icon = FlowerIcon;
    textColor = 'text-black';
  } else {
    return null;
  }

  return (
    <div className={`${bgColor} ${textColor} text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center`}>
      <Icon />
      <span>{level}</span>
    </div>
  );
};

export default LevelBadge;