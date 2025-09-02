import React, { useState } from 'react';
import AudioVisualizer from './AudioVisualizer';
import ViewersIcon from './icons/ViewersIcon';
import CrossIcon from './icons/CrossIcon';
import CoinBIcon from './icons/CoinBIcon';
import PinkHeartIcon from './icons/PinkHeartIcon';
import type { Viewer } from '../types';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';
import PlusIcon from './icons/PlusIcon';
import CheckIcon from './icons/CheckIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import Flag from './Flag';

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
  isCurrentUserHost: boolean;
  isFollowing: boolean;
  onFollowToggle: () => void;
  streamerIsAvatarProtected?: boolean;
  countryCode?: string | null;
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
  isCurrentUserHost,
  isFollowing,
  onFollowToggle,
  streamerIsAvatarProtected,
  countryCode,
}) => {
  const isSingle = variant === 'single';

  const FollowButton: React.FC = () => {
    const [isFollowLoading, setIsFollowLoading] = useState(false);

    const handleToggle = () => {
        if (isFollowLoading) return;
        setIsFollowLoading(true);
        // The parent's optimistic update will cause a re-render, resetting the loading state.
        // This is primarily to prevent rapid double-clicks.
        onFollowToggle();
    };
    
    if (isCurrentUserHost) return null;

    return (
        <button 
            onClick={handleToggle}
            disabled={isFollowLoading}
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${isFollowing ? 'bg-gray-500/80' : 'bg-pink-500/80'} disabled:opacity-70`}
        >
            {isFollowLoading ? (
                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : isFollowing ? <CheckIcon className="w-5 h-5 text-white" /> : <PlusIcon className="w-5 h-5 text-white" />}
        </button>
      )
  };

  if (isSingle) {
    return (
      <div className="flex justify-between items-start w-full">
        {/* Left section */}
        <div className="flex flex-col items-start gap-2">
            <div className="flex items-center gap-2 pointer-events-auto">
                <button onClick={onUserClick} className="flex items-center gap-2 bg-black/40 backdrop-blur-sm p-1 pr-3 rounded-full">
                    <div className="relative">
                        <Avatar src={avatarUrl} alt={name} className="w-9 h-9" />
                        {countryCode && (
                            <Flag code={countryCode} className="w-4 h-auto rounded-full border border-black absolute -bottom-0.5 -right-0.5" />
                        )}
                    </div>
                    <div className="max-w-[120px] sm:max-w-[150px]">
                    <div className="font-semibold text-sm text-white flex items-center gap-1.5">
                        <span className="truncate">{name}</span>
                        {streamerIsAvatarProtected && (
                             <div className="p-0.5 bg-sky-500/80 rounded-full animate-protection-glow" title="Avatar Protegido">
                                <ShieldCheckIcon className="w-2.5 h-2.5 text-white"/>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-gray-300 truncate">{followers} {Number(followers) === 1 ? 'seguidor' : 'seguidores'}</p>
                    </div>
                    <AudioVisualizer />
                </button>
                <FollowButton />
            </div>
          <div className="flex items-center gap-2">
             <button onClick={onCoinsClick} className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full pointer-events-auto">
                <CoinBIcon className="w-5 h-5" />
                <span className="text-sm font-semibold text-white">{coins}</span>
            </button>
            <button className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full pointer-events-auto">
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

  // PK Battle Variants
  const mainContainerClasses = `flex items-center gap-2 pointer-events-auto ${variant === 'pk-right' ? 'flex-row-reverse' : 'flex-row'}`;
  
  return (
    <div className={mainContainerClasses}>
        <button onClick={onUserClick} className="flex items-center gap-2 bg-black/40 backdrop-blur-sm p-1 pr-3 rounded-full">
            <div className="relative">
                <Avatar src={avatarUrl} alt={name} className="w-9 h-9" />
                {countryCode && (
                     <Flag code={countryCode} className="w-4 h-auto rounded-full border border-black absolute -bottom-0.5 -right-0.5" />
                )}
            </div>
            <p className="font-semibold text-sm text-white truncate max-w-[100px]">{name}</p>
        </button>
        <FollowButton />
        {variant === 'pk-right' && onExitClick && (
            <button onClick={onExitClick} className="w-9 h-9 flex-shrink-0 items-center justify-center bg-black/40 backdrop-blur-sm rounded-full">
                <CrossIcon className="w-5 h-5" />
            </button>
        )}
    </div>
  );
};

export default LiveStreamHeader;