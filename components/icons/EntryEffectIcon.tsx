
import React from 'react';

interface EntryEffectIconProps {
  level: number;
  streamerName: string;
  userName: string;
}

export const EntryEffectIcon: React.FC<EntryEffectIconProps> = ({ level, streamerName, userName }) => (
  <div className="bg-gradient-to-r from-orange-400 to-amber-500 rounded-full px-3 py-1 flex items-center space-x-2 text-white text-xs font-bold shadow-lg">
    <div className="flex items-center space-x-1">
      <span className="bg-orange-600 rounded-full w-4 h-4 flex items-center justify-center text-white text-[10px]">{level}</span>
      <span>{streamerName}</span>
      <span>🌹</span>
    </div>
    <span>{userName} Chegou</span>
  </div>
);
