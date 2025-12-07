import React from 'react';
import { FemaleIcon, MaleIcon, StarIcon } from './icons';

interface BadgesProps {
  gender: 'male' | 'female' | 'not_specified';
  age: number;
  level: number;
  size?: 'sm' | 'md' | 'lg';
}

const Badges: React.FC<BadgesProps> = ({ 
  gender, 
  age, 
  level, 
  size = 'md' 
}) => {
  const isMale = gender === 'male';
  const sizeClasses = {
    sm: {
      container: 'space-x-1',
      text: 'text-xs',
      icon: 'w-3 h-3',
      badge: 'w-4 h-4',
    },
    md: {
      container: 'space-x-2',
      text: 'text-sm',
      icon: 'w-4 h-4',
      badge: 'w-5 h-5',
    },
    lg: {
      container: 'space-x-3',
      text: 'text-base',
      icon: 'w-5 h-5',
      badge: 'w-6 h-6',
    },
  };

  const { container, text, icon, badge } = sizeClasses[size];

  return (
    <div className={`flex items-center ${container}`}>
      {/* Gender Badge */}
      <div className={`flex items-center justify-center rounded-full ${isMale ? 'bg-blue-500' : 'bg-pink-500'} ${badge}`}>
        {isMale ? (
          <MaleIcon className={`text-white ${icon}`} />
        ) : (
          <FemaleIcon className={`text-white ${icon}`} />
        )}
      </div>
      
      {/* Age */}
      <span className={`text-gray-300 ${text}`}>{age}</span>
      
      {/* Level Badge */}
      <div className="flex items-center">
        <StarIcon className={`text-yellow-400 ${icon} mr-1`} />
        <span className={`text-yellow-400 ${text}`}>{level}</span>
      </div>
    </div>
  );
};

export default Badges;
