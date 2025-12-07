import React from 'react';
import { RankedUser } from '../types';
import { FemaleIcon, MaleIcon, CrownIcon, DiamondIcon } from './icons';

interface RankOneDisplayProps {
  user: RankedUser;
}

const RankOneDisplay: React.FC<RankOneDisplayProps> = ({ user }) => {
  const isMale = user.gender === 'male';
  
  return (
    <div className="flex flex-col items-center justify-center mb-6">
      <div className="relative mb-3">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
          <CrownIcon className="w-10 h-10 text-yellow-400" />
        </div>
        <div className="relative">
          <img 
            src={user.avatarUrl} 
            alt={user.name} 
            className="w-24 h-24 rounded-full object-cover border-4 border-yellow-400" 
          />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
            TOP 1
          </div>
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-white text-center mb-1">{user.name}</h3>
      
      <div className="flex items-center space-x-2 mb-2">
        <span className={`flex items-center justify-center w-6 h-6 rounded-full ${isMale ? 'bg-blue-500' : 'bg-pink-500'}`}>
          {isMale ? (
            <MaleIcon className="w-4 h-4 text-white" />
          ) : (
            <FemaleIcon className="w-4 h-4 text-white" />
          )}
        </span>
        <span className="text-gray-300 text-sm">{user.age}</span>
        <span className="text-yellow-400 text-sm">★ {user.level}</span>
      </div>
      
      <div className="flex items-center bg-black/30 rounded-full px-4 py-2">
        <span className="text-yellow-400 font-bold text-lg">
          {user.contribution.toLocaleString()}
        </span>
        <DiamondIcon className="w-5 h-5 text-yellow-400 ml-1" />
      </div>
    </div>
  );
};

export default RankOneDisplay;
