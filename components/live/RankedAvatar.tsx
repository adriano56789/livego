import React from 'react';
import { User } from '../../types';
import { avatarFrames, getRemainingDays, getFrameGlowClass } from '../../services/database';

const RankedAvatarBadge: React.FC<{ rank: number }> = ({ rank }) => {
    // Only show badges for top 3
    if (rank > 3) {
        return null;
    }

    // Define styles based on rank
    const getBadgeStyle = (): React.CSSProperties => {
        const baseStyle: React.CSSProperties = {
            position: 'absolute',
            top: '-0.5rem',
            left: '50%',
            transform: 'translateX(-50%) scale(0.7)',
            minWidth: '1.1rem',
            minHeight: '1.1rem',
            padding: '0.15rem 0.3rem',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.4)',
            fontWeight: 'bold',
            fontSize: '0.7rem',
            lineHeight: '0.8rem',
            border: '1px solid',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            color: '#facc15',
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
        };

        if (rank === 1) {
            return {
                ...baseStyle,
                backgroundColor: 'rgba(15, 15, 15, 0.95)',
                color: '#facc15',
                borderColor: '#facc15',
                boxShadow: '0 1px 3px 0 rgba(234, 179, 8, 0.4)'
            };
        } else if (rank === 2) {
            return {
                ...baseStyle,
                backgroundColor: 'rgba(15, 15, 15, 0.95)',
                color: '#d1d5db',
                borderColor: '#d1d5db',
                boxShadow: '0 1px 3px 0 rgba(209, 213, 219, 0.4)'
            };
        } else {
            return {
                ...baseStyle,
                backgroundColor: 'rgba(15, 15, 15, 0.95)',
                color: '#cd7f32',
                borderColor: '#cd7f32',
                boxShadow: '0 1px 3px 0 rgba(205, 127, 50, 0.4)'
            };
        }
    };

    return (
        <div style={getBadgeStyle()}>
            {rank}
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
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" />
             {ActiveFrameComponent && (
                <div className={`absolute -top-1 -left-1 w-10 h-10 pointer-events-none ${frameGlowClass}`}>
                    <ActiveFrameComponent />
                </div>
            )}
            <RankedAvatarBadge rank={rank} />
        </button>
    );
};
