import React from 'react';

interface FanBadgeIconProps {
  level: number;
  streamerName: string;
}

export const FanBadgeIcon: React.FC<FanBadgeIconProps> = ({ level, streamerName }) => {
    let badgeStyle = {
        gradient: 'from-slate-500 to-slate-700', // Iron
        textColor: 'text-slate-200',
        icon: '🛡️',
        levelRingColor: 'bg-slate-600'
    };

    if (level >= 5 && level <= 9) { // Bronze
        badgeStyle = {
            gradient: 'from-amber-600 to-yellow-800',
            textColor: 'text-yellow-100',
            icon: '🥉',
            levelRingColor: 'bg-yellow-900'
        };
    } else if (level >= 10 && level <= 14) { // Silver
        badgeStyle = {
            gradient: 'from-gray-300 to-gray-500',
            textColor: 'text-gray-800',
            icon: '🥈',
            levelRingColor: 'bg-gray-400'
        };
    } else if (level >= 15 && level <= 19) { // Gold
        badgeStyle = {
            gradient: 'from-yellow-400 to-amber-500',
            textColor: 'text-white',
            icon: '🥇',
            levelRingColor: 'bg-amber-600'
        };
    } else if (level >= 20) { // Diamond
        badgeStyle = {
            gradient: 'from-cyan-300 to-blue-500',
            textColor: 'text-white',
            icon: '💎',
            levelRingColor: 'bg-cyan-600'
        };
    }
    
    return (
      <span className={`bg-gradient-to-br ${badgeStyle.gradient} rounded-full px-2 py-0.5 inline-flex items-center space-x-1.5 ${badgeStyle.textColor} text-xs font-bold shadow-md`}>
        <span className={`${badgeStyle.levelRingColor} rounded-full w-4 h-4 flex items-center justify-center text-white text-[10px]`}>{level}</span>
        <span className="truncate max-w-[80px]">{streamerName}</span>
        <span>{badgeStyle.icon}</span>
      </span>
    );
};