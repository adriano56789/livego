import React from 'react';
import { User } from '../../types';
import { KingsCrownGiftIcon } from '../icons';

interface Supporter extends User {
    contribution: number;
}

interface SupportersBarProps {
    streamerSupporters: Supporter[];
    opponentSupporters?: Supporter[];
    onViewProfile: (user: User) => void;
}

const RankedSupporterAvatar: React.FC<{ user: User; rank: number; onViewProfile: (user: User) => void }> = ({ user, rank, onViewProfile }) => {
    const rankColor = rank === 1 ? 'border-yellow-400' : rank === 2 ? 'border-gray-400' : rank === 3 ? 'border-yellow-600' : 'border-gray-700';

    const renderRankBadge = () => {
        if (rank === 1) {
            return (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 pointer-events-none" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))' }}>
                    <KingsCrownGiftIcon className="w-full h-full" />
                </div>
            )
        }
        return (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-white text-xs font-bold border border-white/30 shadow-lg">
                {rank}
            </div>
        );
    }

    return (
        <button onClick={() => onViewProfile(user)} className="relative focus:outline-none pointer-events-auto pt-2">
            <img
                src={user.avatarUrl}
                alt={user.name}
                className={`w-10 h-10 rounded-full object-cover border-2 ${rankColor} shadow-lg transition-transform hover:scale-110 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900`}
                title={`${user.name} - Rank ${rank}`}
            />
            {renderRankBadge()}
        </button>
    );
};


export const SupportersBar: React.FC<SupportersBarProps> = ({ streamerSupporters, opponentSupporters = [], onViewProfile }) => {
    const maxAvatars = 5;
    
    const sortedStreamerSupporters = [...streamerSupporters].sort((a, b) => b.contribution - a.contribution).slice(0, maxAvatars);
    const sortedOpponentSupporters = [...opponentSupporters].sort((a, b) => b.contribution - a.contribution).slice(0, maxAvatars);

    if (sortedStreamerSupporters.length === 0 && sortedOpponentSupporters.length === 0) {
        return null;
    }

    return (
        <div className="h-20 bg-black/50 flex items-center justify-between px-4 pointer-events-none">
            {/* Streamer Supporters (Left) */}
            <div className="flex items-center space-x-3">
                {sortedStreamerSupporters.map((user, index) => (
                    <RankedSupporterAvatar key={user.id} user={user} rank={index + 1} onViewProfile={onViewProfile} />
                ))}
            </div>
            {/* Opponent Supporters (Right) */}
            <div className="flex items-center flex-row-reverse space-x-3 space-x-reverse">
                {sortedOpponentSupporters.map((user, index) => (
                    <RankedSupporterAvatar key={user.id} user={user} rank={index + 1} onViewProfile={onViewProfile} />
                ))}
            </div>
        </div>
    );
};

export default SupportersBar;