import React from 'react';
import { RankedUser } from '../types';
import { FemaleIcon, MaleIcon, DiamondIcon } from './icons';

interface RankListItemProps {
  user: RankedUser;
  position: number;
  isTop3?: boolean;
}

const RankListItem: React.FC<RankListItemProps> = ({ user, position, isTop3 = false }) => {
  const isMale = user.gender === 'male';
  const positionColors = [
    'bg-yellow-400 text-black', // 1st
    'bg-gray-300 text-black',   // 2nd
    'bg-amber-600 text-white',  // 3rd
    'bg-gray-800 text-white'    // 4th+
  ];
  
  const positionClass = isTop3 
    ? positionColors[position - 1] 
    : positionColors[3];
  
  return (
    <div className="flex items-center p-3 bg-gray-800/50 rounded-xl mb-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${positionClass}`}>
        {position}
      </div>
      
      <img 
        src={user.avatarUrl} 
        alt={user.name} 
        className="w-12 h-12 rounded-full object-cover mr-3" 
      />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-white truncate">{user.name}</h4>
        <div className="flex items-center space-x-2 mt-1">
          <span className={`flex items-center justify-center w-5 h-5 rounded-full ${isMale ? 'bg-blue-500' : 'bg-pink-500'}`}>
            {isMale ? (
              <MaleIcon className="w-3 h-3 text-white" />
            ) : (
              <FemaleIcon className="w-3 h-3 text-white" />
            )}
          </span>
          <span className="text-gray-300 text-xs">{user.age}</span>
          <span className="text-yellow-400 text-xs">★ {user.level}</span>
        </div>
      </div>
      
      <div className="flex items-center bg-black/30 rounded-full px-3 py-1">
        <span className="text-yellow-400 font-semibold text-sm">
          {user.contribution.toLocaleString()}
        </span>
        <DiamondIcon className="w-4 h-4 text-yellow-400 ml-1" />
      </div>
    </div>
  );
};

export default RankListItem;
