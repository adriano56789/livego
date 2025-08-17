
import React from 'react';
import type { PkBattleStreamer, LiveDetails } from '../types';
import CoinBIcon from './icons/CoinBIcon';
import PinkHeartIcon from './icons/PinkHeartIcon';

const formatStatNumber = (num: number): string => {
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(num);
};

interface PkStreamerHeaderProps {
  streamer: PkBattleStreamer;
  details: LiveDetails | null;
  onUserClick: (userId: number) => void;
  onOpenRanking: () => void;
}

const PkStreamerHeader: React.FC<PkStreamerHeaderProps> = ({ streamer, details, onUserClick, onOpenRanking }) => {
  return (
    <div className="flex flex-col gap-2 items-start">
      <button 
        onClick={() => onUserClick(streamer.userId)}
        className="bg-black/40 backdrop-blur-sm p-1 pr-3 rounded-full flex items-center gap-2"
      >
        <img src={streamer.avatarUrl} alt={streamer.name} className="w-8 h-8 rounded-full object-cover" />
        <div>
          <p className="font-bold text-sm text-white truncate max-w-[100px]">{streamer.name}</p>
          <div className="flex items-center gap-1.5 text-xs text-gray-300">
            ||
            <span>{formatStatNumber(details?.streamerFollowers || 0)}</span>
          </div>
        </div>
      </button>

      <button
        onClick={onOpenRanking}
        className="bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-3 hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-1">
          <CoinBIcon className="w-4 h-4" />
          <span className="font-semibold text-xs text-white">{formatStatNumber(details?.receivedGiftsValue || 0)}</span>
        </div>
        <div className="flex items-center gap-1">
          <PinkHeartIcon className="w-4 h-4" />
          <span className="font-semibold text-xs text-white">{formatStatNumber(details?.likeCount || 0)}</span>
        </div>
      </button>
    </div>
  );
};

export default PkStreamerHeader;
