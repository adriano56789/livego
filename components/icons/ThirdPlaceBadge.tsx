
import React from 'react';

const ThirdPlaceBadge: React.FC<{ avatarUrl: string }> = ({ avatarUrl }) => (
     <div className="relative flex flex-col items-center">
         <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 text-white font-bold text-xs bg-amber-700 w-4 h-4 rounded-full flex items-center justify-center border border-amber-500">
             <span className="font-serif italic text-sm -mt-0.5">D</span>
         </div>
        <img src={avatarUrl} alt="3rd place" className="w-8 h-8 rounded-full border-2 border-amber-600" />
    </div>
);

export default ThirdPlaceBadge;
