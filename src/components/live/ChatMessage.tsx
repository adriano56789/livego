import React, { useState } from 'react';
import { TranslateIcon, FanBadgeIcon } from '../icons';
import { avatarFrames, getRemainingDays, getFrameGlowClass } from '../../services/database';
import { User } from '../../types';

interface ChatMessageProps {
    userObject: User;
    message: string | React.ReactNode;
    translatedText?: string;
    onAvatarClick: () => void;
    streamerId: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ userObject, message, translatedText, onAvatarClick, streamerId }) => {
    const { name: user, level, avatarUrl, activeFrameId, ownedFrames, rank, fanClub } = userObject;
    const [isTranslated, setIsTranslated] = useState(false);

    const activeOwnedFrame = ownedFrames?.find(f => f.frameId === activeFrameId);
    const remainingDays = getRemainingDays(activeOwnedFrame?.expirationDate);

    const activeFrame = (activeFrameId && activeOwnedFrame && remainingDays > 0)
        ? avatarFrames.find(f => f.id === activeFrameId)
        : null;
    const ActiveFrameComponent = activeFrame ? activeFrame.component : null;
    const frameGlowClass = getFrameGlowClass(activeFrameId);

    const canBeTranslated = translatedText && translatedText !== message;
    const textToShow = isTranslated ? translatedText : message;

    const isFan = fanClub && fanClub.streamerId === streamerId;

    const renderMessageWithMentions = (text: string | React.ReactNode): React.ReactNode => {
        if (typeof text !== 'string') {
            return text; // It's already a ReactNode (e.g., from a gift message)
        }

        const mentionRegex = /(@[a-zA-Z0-9_.-]+)/g;
        const parts = text.split(mentionRegex);

        return parts.map((part, index) => {
            if (index % 2 === 1) { // Matched parts are at odd indices
                return (
                    <span key={index} className="text-blue-400 font-bold">
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    return (
        <div className="relative self-start text-xs mt-1">
            <div className="chat-bubble">
                <button onClick={onAvatarClick} className="relative w-8 h-8 flex-shrink-0 self-start">
                    <img src={avatarUrl} alt={user} className="w-full h-full rounded-full object-cover"/>
                    {ActiveFrameComponent && (
                        <div className={`absolute -top-1 -left-1 w-10 h-10 pointer-events-none ${frameGlowClass}`}>
                            <ActiveFrameComponent />
                        </div>
                    )}
                </button>
                 <div className="min-w-0 flex items-baseline flex-wrap gap-x-1.5 leading-snug">
                    {isFan && fanClub ? (
                        <FanBadgeIcon
                            level={fanClub.level}
                            streamerName={fanClub.streamerName}
                        />
                    ) : (
                        <span className="level-badge">
                            <span>💎</span>
                            <span className="ml-1">{level}</span>
                        </span>
                    )}
                    {rank && rank > 0 && rank <= 3 && (
                        <span className="rank-badge ml-1.5">{rank}</span>
                    )}
                    {!isFan && (
                        <span className="text-amber-300 font-semibold ml-1.5">{user}</span>
                    )}
                    
                    <div className="ml-1.5 text-white break-words">
                       {renderMessageWithMentions(textToShow)}
                    </div>

                    {canBeTranslated && (
                        <button
                            onClick={() => setIsTranslated(p => !p)}
                            className="bg-black/30 rounded-full w-5 h-5 p-0.5 hover:bg-black/50 transition-colors inline-flex items-center justify-center align-middle ml-1.5"
                            title={isTranslated ? "Mostrar original" : "Traduzir"}
                        >
                            <TranslateIcon className="w-full h-full text-white/80" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
export default ChatMessage;