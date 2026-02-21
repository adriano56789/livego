import React from 'react';
import { User } from '../../types';
import { avatarFrames, getRemainingDays, getFrameGlowClass } from '../../services/database';
import { PlusIcon } from '../icons';

interface EntryChatMessageProps {
    user: User;
    currentUser: User;
    onClick: (user: User) => void;
    onFollow: (user: User) => void;
    isFollowed: boolean;
}

const EntryChatMessage: React.FC<EntryChatMessageProps> = ({ user, currentUser, onClick, onFollow, isFollowed }) => {
    const activeOwnedFrame = user.ownedFrames?.find(f => f.frameId === user.activeFrameId);
    const remainingDays = getRemainingDays(activeOwnedFrame?.expirationDate);
    const activeFrame = (user.activeFrameId && activeOwnedFrame && remainingDays && remainingDays > 0)
        ? avatarFrames.find(f => f.id === user.activeFrameId)
        : null;
    const ActiveFrameComponent = activeFrame ? activeFrame.component : null;
    const frameGlowClass = getFrameGlowClass(user.activeFrameId);

    const showFollowButton = user.id !== currentUser.id && !isFollowed;

    return (
        <div 
            className="bg-black/30 rounded-full p-1 pr-2 flex items-center self-start text-xs"
        >
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onClick(user);
                }}
                className="flex items-center pl-1 pr-2 hover:opacity-80 transition-opacity"
            >
                <div className="relative w-6 h-6 mr-2">
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                    {ActiveFrameComponent && (
                        <div className={`absolute -top-1 -left-1 w-8 h-8 pointer-events-none ${frameGlowClass}`}>
                            <ActiveFrameComponent />
                        </div>
                    )}
                </div>
                <span className="text-yellow-300 font-semibold">{user.name}</span>
                <span className="text-purple-400 font-semibold text-xs ml-1.5">Lv.{user.level}</span>
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