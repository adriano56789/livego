
import React from 'react';
import { User } from '../../types';

interface RankedAvatarProps {
    user: User;
    rank: number;
    onClick: (user: User) => void;
}

export const RankedAvatar: React.FC<RankedAvatarProps> = ({ user, rank, onClick }) => {
    const borderColors = ['border-yellow-400', 'border-gray-300', 'border-orange-400'];
    return (
        <div 
            className="relative cursor-pointer" 
            onClick={() => typeof onClick === 'function' && onClick(user)}
        >
            <img src={user.avatarUrl} className={`w-8 h-8 rounded-full border-2 ${borderColors[rank-1] || 'border-transparent'}`} />
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-black ${rank === 1 ? 'bg-yellow-400' : rank === 2 ? 'bg-gray-300' : 'bg-orange-400'}`}>
                {rank}
            </div>
        </div>
    )
}
