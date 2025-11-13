import React from 'react';
// FIX: Imports are incorrect. The error states an alias is being used.
import { PlusIcon, SettingsIcon, IdBadgeIcon } from '../components/icons';
import { avatarFrames, getRemainingDays, getFrameGlowClass } from '../services/database';
import { User } from '../types';

interface ChatMessageProps {
    userObject: User;
    message: string | React.ReactNode;
    onAvatarClick: () => void;
    onFollow?: () => void;
    isFollowed?: boolean;
    onModerationClick?: () => void;
    isModerator?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ userObject, message, onAvatarClick, onFollow, isFollowed, onModerationClick, isModerator }) => {
    const { name: user, level, avatarUrl, activeFrameId, ownedFrames } = userObject;

    const activeOwnedFrame = ownedFrames?.find(f => f.frameId === activeFrameId);
    const remainingDays = getRemainingDays(activeOwnedFrame?.expirationDate);

    const activeFrame = (activeFrameId && activeOwnedFrame && remainingDays > 0)
        ? avatarFrames.find(f => f.id === activeFrameId)
        : null;
    const ActiveFrameComponent = activeFrame ? activeFrame.component : null;
    const frameGlowClass = getFrameGlowClass(activeFrameId);

    return (
    <div className="flex items-start space-x-2 text-xs">
        <button onClick={onAvatarClick} className="relative w-8 h-8 flex-shrink-0">
            <img src={userObject.avatarUrl} alt={userObject.name} className="w-full h-full rounded-full object-cover"/>
            {ActiveFrameComponent && (
                <div className={`absolute -top-1 -left-1 w-10 h-10 pointer-events-none ${frameGlowClass}`}>
                    <ActiveFrameComponent />
                </div>
            )}
        </button>
        <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5">
                <p className="text-gray-400">{userObject.name} <span className="text-purple-400 font-semibold text-xs ml-1">Lv.{userObject.level}</span></p>
                {isModerator && (
                    <div className="bg-yellow-500/20 rounded-full p-0.5 flex items-center justify-center" title="Moderador">
                        <IdBadgeIcon className="w-3 h-3 text-yellow-400" />
                    </div>
                )}
                {onModerationClick && (
                    <button 
                        onClick={onModerationClick} 
                        className="text-gray-400 rounded-full w-5 h-5 flex items-center justify-center hover:bg-gray-700 transition-colors"
                        aria-label={`Moderar ${userObject.name}`}
                    >
                        <SettingsIcon className="w-4 h-4" />
                    </button>
                )}
                {onFollow && !isFollowed && !onModerationClick && (
                    <button 
                        onClick={onFollow} 
                        className="bg-purple-600/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-purple-500/50 transition-colors"
                        aria-label={`Follow ${userObject.name}`}
                    >
                        <PlusIcon className="w-3 h-3" />
                    </button>
                )}
            </div>
            {/* FIX: Wrap message in a paragraph tag for proper rendering. */}
            <div className="bg-black/40 backdrop-blur-sm rounded-lg p-2 mt-1 inline-block shadow-lg shadow-black/50">
                <p className="text-white break-words">{message}</p>
            </div>
        </div>
    </div>
);
}
export default ChatMessage;