
import React from 'react';

const SecondPlaceBadge: React.FC<{ avatarUrl: string }> = ({ avatarUrl }) => (
    <div className="relative flex flex-col items-center">
         <span className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 text-white font-bold text-xs bg-gray-500 px-1.5 rounded-sm">2</span>
        <img src={avatarUrl} alt="2nd place" className="w-8 h-8 rounded-full border-2 border-gray-400" />
    </div>
);

export default SecondPlaceBadge;
