

import React from 'react';
import type { PkBattle, Stream, PkBattleStreamer } from '../types';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';

interface PkBattleCardProps {
    battle: PkBattle;
    onViewStream: (stream: PkBattle) => void;
}

const StreamerImage: React.FC<{ streamer: PkBattleStreamer; gradient: string }> = ({ streamer, gradient }) => {
    const colors = ['bg-pink-900', 'bg-blue-900', 'bg-green-900', 'bg-purple-900', 'bg-red-900', 'bg-orange-900'];
    const color = colors[streamer.userId % colors.length];

    return (
        <div className="w-1/2 h-full relative">
            {streamer.avatarUrl ? (
                <img src={streamer.avatarUrl} alt={streamer.name} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
                <div className={`absolute inset-0 w-full h-full ${color} flex items-center justify-center`}>
                     <UserPlaceholderIcon className="w-1/2 h-1/2 text-gray-500"/>
                </div>
            )}
            <div className={`absolute inset-0 ${gradient}`}></div>
        </div>
    )
}

const PkBattleCard: React.FC<PkBattleCardProps> = ({ battle, onViewStream }) => {
    const { streamer1, streamer2 } = battle;

    const totalScore = (streamer1.score || 0) + (streamer2.score || 0);
    const streamer1Percent = totalScore > 0 ? ((streamer1.score || 0) / totalScore) * 100 : 50;

    const formatScore = (num: number): string => {
        const value = num || 0;
        if (value >= 10000) {
            return (value / 1000).toFixed(1) + 'k';
        }
        return value.toLocaleString('en-US');
    };

    return (
        <button 
            onClick={() => onViewStream(battle)}
            className="relative rounded-2xl overflow-hidden aspect-[16/10] flex flex-col justify-between text-white shadow-lg bg-gray-900 w-full text-left"
        >
            {/* Background Images */}
            <div className="absolute inset-0 flex">
                <StreamerImage streamer={streamer1} gradient="bg-gradient-to-r from-black/60 to-transparent" />
                <StreamerImage streamer={streamer2} gradient="bg-gradient-to-l from-black/60 to-transparent" />
            </div>

            {/* VS Logo in the middle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-14 h-14 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-pink-500/70 shadow-lg">
                    <span className="text-pink-400 font-black text-2xl italic">VS</span>
                </div>
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 flex justify-between items-end p-3 flex-grow">
                {/* Streamer 1 Info */}
                <div className="flex flex-col items-start">
                    <h3 className="font-bold text-lg drop-shadow-md truncate max-w-[120px]">{streamer1.name}</h3>
                </div>

                {/* Streamer 2 Info */}
                <div className="flex flex-col items-end">
                    <h3 className="font-bold text-lg drop-shadow-md truncate max-w-[120px]">{streamer2.name}</h3>
                </div>
            </div>
            
            {/* Score Bar */}
            <div className="relative z-10 p-3 pt-0">
                <div className="relative w-full h-8 bg-black/30 rounded-full overflow-hidden flex items-center border border-white/10">
                    {/* Progress Fill */}
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 ease-out"
                        style={{ width: `${streamer1Percent}%` }}
                    ></div>
                    <div
                        className="h-full bg-gradient-to-l from-pink-500 to-red-400 transition-all duration-500 ease-out"
                        style={{ width: `${100 - streamer1Percent}%` }}
                    ></div>

                    {/* Scores Text */}
                    <div className="absolute inset-0 flex justify-between items-center px-3">
                        <span className="font-bold text-base text-white drop-shadow-lg">{formatScore(streamer1.score)}</span>
                        <span className="font-bold text-base text-white drop-shadow-lg">{formatScore(streamer2.score)}</span>
                    </div>
                </div>
            </div>
        </button>
    );
};

export default PkBattleCard;