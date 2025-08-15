import React from 'react';
import type { PkLevelBadge as PkLevelBadgeType } from '../types';
import FireIcon from './icons/FireIcon';
import ButterflyIcon from './icons/ButterflyIcon';
import RedHeartIcon from './icons/RedHeartIcon';
import SmallCrownIcon from './icons/SmallCrownIcon';

interface PkLevelBadgeProps {
  badge: PkLevelBadgeType;
}

const PkLevelBadge: React.FC<PkLevelBadgeProps> = ({ badge }) => {
  let IconComponent;
  let bgColor;

  switch (badge.type) {
    case 'fire':
      IconComponent = FireIcon;
      bgColor = 'bg-red-500/80';
      break;
    case 'butterfly':
      IconComponent = ButterflyIcon;
      bgColor = 'bg-purple-500/80';
      break;
    case 'red-heart':
      IconComponent = RedHeartIcon;
      bgColor = 'bg-pink-500/80';
      break;
    case 'small-crown':
      IconComponent = SmallCrownIcon;
      bgColor = 'bg-yellow-500/80';
      break;
    default:
      return null;
  }

  return (
    <div className={`flex items-center gap-0.5 ${bgColor} text-white text-[10px] font-bold px-1 py-0.5 rounded-sm`}>
      <IconComponent className="w-2.5 h-2.5" />
      {badge.level && <span>{badge.level}</span>}
    </div>
  );
};

export default PkLevelBadge;