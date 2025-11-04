import React from 'react';
// FIX: Import Streamer type
import { User, Streamer } from '../../types';
import { avatarFrames, getRemainingDays, getFrameGlowClass } from '../../services/database';
import { PlusIcon, FanBadgeIcon } from '../icons';

interface EntryChatMessageProps {
    user: User;
    currentUser: User;
    onClick: (user: User) => void;
    onFollow: (user: User) => void;
    isFollowed: boolean;
    // FIX: Add streamer prop to determine fan club status for the correct stream
    streamer: Streamer;
}

const EntryChatMessage: React.FC<EntryChatMessageProps> = ({ user, currentUser, onClick, onFollow, isFollowed, streamer }) => {
    const activeOwnedFrame = user.ownedFrames?.find(f => f.frameId === user.activeFrameId);
    const remainingDays = getRemainingDays(activeOwnedFrame?.expirationDate);
    const activeFrame = (user.activeFrameId && activeOwnedFrame && remainingDays > 0)
        ? avatarFrames.find(f => f.id === user.activeFrameId)
        : null;
    const ActiveFrameComponent = activeFrame ? activeFrame.component : null;
    const frameGlowClass = getFrameGlowClass(user.activeFrameId);

    const showFollowButton = user.id !== currentUser.id && !isFollowed;
    // FIX: Check fan club membership against the current streamer's ID
    const isFan = user.fanClub && streamer && user.fanClub.streamerId === streamer.hostId;

    return (
        <div 
            className="bg-black/30 rounded-full p-1 pr-2 flex items-center self-start text-xs shadow-md"
        >
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onClick(user);
                }}
                className="flex items-center pl-1 pr-2 hover:opacity-80 transition-opacity"
            >
                <div className="relative w-6 h-6 mr-2">
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" />
                    {ActiveFrameComponent && (
                        <div className={`absolute -top-1 -left-1 w-8 h-8 pointer-events-none ${frameGlowClass}`}>
                            <ActiveFrameComponent />
                        </div>
                    )}
                </div>

                <div className="relative">
                    {isFan && user.fanClub && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 scale-75">
                            <FanBadgeIcon
                                level={user.fanClub.level}
                                streamerName={user.fanClub.streamerName}
                            />
                        </div>
                    )}
                    <div className={`flex items-center space-x-1.5 ${isFan ? 'pt-2' : ''}`}>
                        <span className="text-yellow-300 font-semibold">{user.name}</span>
                        <div className="level-badge">
                            <span>💎</span>
                            <span className="ml-1">{user.level}</span>
                        </div>
                    </div>
                </div>

                <span className="text-gray-200 ml-1.5">entrou na sala.</span>
            </button>
            {showFollowButton && (
                 <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onFollow(user);
                    }}
                    className="ml-1 w-6 h-6 bg-purple-600/50 text-white rounded-full flex items-center justify-center hover:bg-purple-500/70 transition-colors flex-shrink-0"
                    aria-label={`Seguir ${user.name}`}
                >
                    <PlusIcon className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

export default EntryChatMessage;