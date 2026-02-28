import React from 'react';
import { User } from '../../types';
import { avatarFrames, getRemainingDays, getFrameGlowClass } from '../../services/database';

const RankedAvatarBadge: React.FC<{ rank: number }> = ({ rank }) => {
    // Only show badges for top 3
    if (rank > 3) {
        return null;
    }

    // User requested specific colors: 1st black, 2nd blue, 3rd other.
    const badgeColor =
        rank === 1 ? 'bg-black' :
        rank === 2 ? 'bg-blue-500' :
        'bg-slate-600';

    // Use a white border for the black badge for contrast
    const borderColor = rank === 1 ? 'border-white/50' : 'border-black';

    // Positioned on top of the avatar's head.
    return (
        <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full flex items-center justify-center border ${badgeColor} ${borderColor} z-10`}>
            <span 
                className="text-white text-[9px] font-bold leading-none"
                style={{ textShadow: '0 0 2px black' }}
            >
                {rank}
            </span>
        </div>
    );
};


interface RankedAvatarProps {
    user: User;
    rank: number;
    onClick: (user: User) => void;
}

export const RankedAvatar: React.FC<RankedAvatarProps> = ({ user, rank, onClick }) => {
    const remainingDays = getRemainingDays(user.frameExpiration);
    const activeFrame = (user.activeFrameId && remainingDays && remainingDays > 0)
      ? avatarFrames.find(f => f.id === user.activeFrameId)
      : null;
    const ActiveFrameComponent = activeFrame ? activeFrame.component : null;
    const frameGlowClass = getFrameGlowClass(user.activeFrameId);

    return (
        <button onClick={(e) => { e.stopPropagation(); onClick(user); }} className="relative shrink-0 w-8 h-8">
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
             {ActiveFrameComponent && (
                <div className={`absolute -top-1 -left-1 w-10 h-10 pointer-events-none ${frameGlowClass}`}>
                    <ActiveFrameComponent />
                </div>
            )}
            <RankedAvatarBadge rank={rank} />
        </button>
    );
};