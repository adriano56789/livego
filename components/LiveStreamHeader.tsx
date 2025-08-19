import React from 'react';
import AudioVisualizer from './AudioVisualizer';
import ViewersIcon from './icons/ViewersIcon';
import CrossIcon from './icons/CrossIcon';
import CoinBIcon from './icons/CoinBIcon';
import PinkHeartIcon from './icons/PinkHeartIcon';
import type { Viewer } from '../types';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';

interface LiveStreamHeaderProps {
  variant: 'single' | 'pk-left' | 'pk-right';
  avatarUrl: string;
  name: string;
  followers: string;
  viewerCount: string;
  headerViewers?: Viewer[];
  coins: string;
  likes: string;
  onUserClick?: () => void;
  onViewersClick?: () => void;
  onExitClick?: () => void;
  onCoinsClick?: () => void;
}

const Avatar: React.FC<{ src?: string; alt: string; className: string; }> = ({ src, alt, className }) => (
    <div className={`${className} rounded-full overflow-hidden bg-gray-700 flex items-center justify-center`}>
        {src ? (
            <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
            <UserPlaceholderIcon className="w-full h-full text-gray-400 p-0.5" />
        )}
    </div>
);


const LiveStreamHeader: React.FC<LiveStreamHeaderProps> = ({
  variant,
  avatarUrl,
  name,
  followers,
  viewerCount,
  headerViewers,
  coins,
  likes,
  onUserClick,
  onViewersClick,
  onExitClick,
  onCoinsClick,
}) => {
  const isSingle = variant === 'single';
  const isPkLeft = variant === 'pk-left';
  const isPkRight = variant === 'pk-right';
  const alignment = isPkRight ? 'items-end' : 'items-start';

  if (isSingle) {
    return (
      <div className="flex justify-between items-start w-full">
        {/* Left section */}
        <div className="flex flex-col items-start gap-2">
          <button onClick={onUserClick} className="flex items-center gap-2 bg-black/40 backdrop-blur-sm p-1 pr-3 rounded-full pointer-events-auto">
            <Avatar src={avatarUrl} alt={name} className="w-9 h-9" />
            <div>
              <p className="font-semibold text-sm text-white">{name}</p>
              <p className="text-xs text-gray-300">{followers} seguidores</p>
            </div>
            <AudioVisualizer />
          </button>
          <div className="flex items-center gap-2">
             <button onClick={onCoinsClick} className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full pointer-events-auto">
                <CoinBIcon className="w-5 h-5" />
                <span className="text-sm font-semibold text-white">{coins}</span>
            </button>
            <button onClick={onCoinsClick} className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full pointer-events-auto">
                <PinkHeartIcon className="w-5 h-5" />
                <span className="text-sm font-semibold text-white">{likes}</span>
            </button>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {headerViewers && headerViewers.length > 0 && (
             <div className="flex items-center -space-x-2">
                {headerViewers.map(v => (
                    <Avatar key={v.id} src={v.avatarUrl} alt={v.name} className="w-7 h-7 border-2 border-black/50"/>
                ))}
            </div>
          )}
          <button onClick={onViewersClick} className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-sm font-semibold pointer-events-auto">
            <ViewersIcon className="w-4 h-4" />
            {viewerCount}
          </button>
          <button onClick={onExitClick} className="w-9 h-9 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-full pointer-events-auto">
            <CrossIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // PK Battle Variant
  return (
    <div className={`w-full flex flex-col ${alignment} gap-1.5`}>
      <div className={`flex items-start gap-2 ${isPkRight ? 'flex-row-reverse' : ''}`}>
        <button onClick={onUserClick} className={`flex items-center gap-2 bg-black/40 backdrop-blur-sm p-1 ${isPkRight ? 'pl-3' : 'pr-3'} rounded-full pointer-events-auto ${isPkRight ? 'flex-row-reverse' : ''}`}>
            <Avatar src={avatarUrl} alt={name} className="w-8 h-8" />
            <div className={`${isPkRight ? 'text-right' : 'text-left'}`}>
                <p className="font-semibold text-sm text-white truncate max-w-[100px]">{name}</p>
                <p className="text-xs text-gray-300">{followers} seguidores</p>
            </div>
            <AudioVisualizer />
        </button>
        {isPkRight && onExitClick && (
            <button onClick={onExitClick} className="w-9 h-9 flex-shrink-0 items-center justify-center bg-black/40 backdrop-blur-sm rounded-full pointer-events-auto">
                <CrossIcon className="w-5 h-5" />
            </button>
        )}
      </div>

      <div className={`flex items-center gap-2 ${isPkRight ? 'flex-row-reverse' : ''}`}>
          {headerViewers && headerViewers.length > 0 && (
              <div className={`flex items-center ${isPkRight ? '-space-x-2 flex-row-reverse' : '-space-x-2'}`}>
                  {headerViewers.map(v => (
                      <Avatar key={v.id} src={v.avatarUrl} alt={v.name} className="w-7 h-7 border-2 border-black/50" />
                  ))}
              </div>
          )}
          <button onClick={onViewersClick} className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full text-sm font-semibold pointer-events-auto">
              <ViewersIcon className="w-4 h-4" />
              {viewerCount}
          </button>
      </div>
      
      <div className={`flex items-center gap-2 ${isPkRight ? 'flex-row-reverse' : ''}`}>
          <button onClick={onCoinsClick} className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full pointer-events-auto">
              <CoinBIcon className="w-5 h-5" />
              <span className="text-sm font-semibold text-white">{coins}</span>
          </button>
          <button onClick={onCoinsClick} className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full pointer-events-auto">
              <PinkHeartIcon className="w-5 h-5" />
              <span className="text-sm font-semibold text-white">{likes}</span>
          </button>
      </div>
    </div>
  );
};

export default LiveStreamHeader;