import React from 'react';

interface PkRankBadgeProps {
  rank: number;
}

const PkRankBadge: React.FC<PkRankBadgeProps> = ({ rank }) => {
    let bgColor, textColor, borderColor;

    switch (rank) {
        case 1:
            bgColor = 'bg-gradient-to-t from-amber-500 to-yellow-400';
            textColor = 'text-amber-900';
            borderColor = 'border-yellow-200';
            break;
        case 2:
            bgColor = 'bg-gradient-to-t from-slate-400 to-slate-300';
            textColor = 'text-slate-700';
            borderColor = 'border-slate-100';
            break;
        case 3:
            bgColor = 'bg-gradient-to-t from-orange-600 to-amber-500';
            textColor = 'text-orange-950';
            borderColor = 'border-amber-300';
            break;
        default:
            return null;
    }

    return (
        <div className={`relative ${bgColor} w-10 h-6 flex flex-col items-center justify-end rounded-t-md border-t-2 ${borderColor}`}>
             <span className={`text-xs font-black ${textColor}`}>TOP</span>
             <span className={`absolute -bottom-1 text-sm font-black italic ${textColor} drop-shadow-sm`}>{rank}</span>
        </div>
    );
};

export default PkRankBadge;