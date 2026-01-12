
import React from 'react';
import { User } from '../../types';

interface SupportersBarProps {
    streamerSupporters: (User & { contribution: number })[];
    opponentSupporters: (User & { contribution: number })[];
    onViewProfile: (user: User) => void;
}

const SupportersBar: React.FC<SupportersBarProps> = ({ streamerSupporters, opponentSupporters, onViewProfile }) => {
    const renderSupporters = (supporters: (User & { contribution: number })[], align: 'left' | 'right') => {
        // Take top 3
        const top3 = supporters.sort((a, b) => b.contribution - a.contribution).slice(0, 3);
        
        return (
            <div className={`flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
                {top3.map((user, index) => (
                    <div key={user.id} className="relative cursor-pointer" onClick={(e) => { e.stopPropagation(); onViewProfile(user); }}>
                        <img 
                            src={user.avatarUrl} 
                            className={`w-8 h-8 rounded-full border-2 ${index === 0 ? 'border-yellow-400 z-10 w-9 h-9' : 'border-white/50'}`}
                            alt={user.name}
                        />
                    </div>
                ))}
                {supporters.length === 0 && (
                    <div className="w-8 h-8 rounded-full bg-black/30 border border-white/10 flex items-center justify-center">
                        <span className="text-xs text-gray-500">?</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full px-4 pb-2 flex justify-between items-end">
            <div className="flex flex-col gap-1">
                <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Apoiadores</span>
                {renderSupporters(streamerSupporters, 'left')}
            </div>
            <div className="flex flex-col gap-1 items-end">
                <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Apoiadores</span>
                {renderSupporters(opponentSupporters, 'right')}
            </div>
        </div>
    );
};

export default SupportersBar;
