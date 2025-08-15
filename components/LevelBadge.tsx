
import React from 'react';
import SimpleStarIcon from './icons/SimpleStarIcon';
import ShieldIcon from './icons/ShieldIcon';
import GemIcon from './icons/GemIcon';


interface LevelBadgeProps {
  level?: number;
}

const LevelBadge: React.FC<LevelBadgeProps> = ({ level }) => {
  let bgColor, Icon, textColor = 'text-white';
  
  // New unique design to avoid copyright issues
  switch (level) {
    case 1:
      bgColor = 'bg-gradient-to-br from-sky-500 to-blue-600';
      Icon = SimpleStarIcon;
      break;
    case 2:
      bgColor = 'bg-gradient-to-br from-emerald-400 to-teal-500';
      Icon = ShieldIcon;
      break;
    case 3:
      bgColor = 'bg-gradient-to-br from-purple-500 to-violet-600';
      Icon = GemIcon;
      break;
    default:
      return null;
  }

  return (
    <div className={`flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${bgColor} ${textColor}`}>
      <Icon className="w-2.5 h-2.5" />
      <span>{level}</span>
    </div>
  );
};

export default LevelBadge;
