import React, { useState } from 'react';
import { PlusIcon, SettingsIcon, IdBadgeIcon, TranslateIcon } from './components/icons';
import { avatarFrames, getRemainingDays, getFrameGlowClass } from './services/database';
import { User } from './types';

interface ChatMessageProps {
    userObject: User;
    message: string | React.ReactNode;
    onAvatarClick: () => void;
    onFollow?: () => void;
    isFollowed?: boolean;
    onModerationClick?: () => void;
    isModerator?: boolean;
    onTranslate?: (text: string) => Promise<string>;
    isTranslated?: boolean;
    originalLanguage?: string;
    targetLanguage?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
    userObject,
    message,
    onAvatarClick,
    onFollow,
    isFollowed,
    onModerationClick,
    isModerator,
    onTranslate,
    isTranslated = false,
    originalLanguage,
    targetLanguage = 'pt'
}) => {
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedText, setTranslatedText] = useState<string | null>(null);
    const [showOriginal, setShowOriginal] = useState(false);

    const handleTranslate = async () => {
        if (typeof message !== 'string' || !onTranslate) return;
        
        try {
            setIsTranslating(true);
            const result = await onTranslate(message);
            setTranslatedText(result);
        } catch (error) {
            console.error('Translation error:', error);
        } finally {
            setIsTranslating(false);
        }
    };

    const displayText = () => {
        if (!translatedText || showOriginal) return message;
        return translatedText;
    };

    const toggleOriginal = () => {
        setShowOriginal(!showOriginal);
    };
    const { name: user, level, avatarUrl, activeFrameId, ownedFrames } = userObject;

    const activeOwnedFrame = ownedFrames?.find(f => f.frameId === activeFrameId);
    const remainingDays = getRemainingDays(activeOwnedFrame?.expirationDate);

    const activeFrame = (activeFrameId && activeOwnedFrame && remainingDays && remainingDays > 0)
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
            <div className="bg-black/40 backdrop-blur-sm rounded-lg p-2 mt-1 inline-block shadow-lg shadow-black/50 relative group">
                <p className="text-white break-words">
                    {displayText()}
                    {isTranslating && (
                        <span className="ml-2 text-xs text-gray-400">Traduzindo...</span>
                    )}
                </p>
                {onTranslate && typeof message === 'string' && (
                    <div className="absolute right-0 -top-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={handleTranslate}
                            disabled={isTranslating || (translatedText && !showOriginal)}
                            className="w-5 h-5 rounded-full bg-purple-600/80 flex items-center justify-center hover:bg-purple-500/80 transition-colors"
                            title={isTranslated ? 'Traduzir mensagem' : undefined}
                        >
                            <TranslateIcon className="w-3 h-3 text-white" />
                        </button>
                        {translatedText && (
                            <button
                                onClick={toggleOriginal}
                                className="text-xs px-2 py-0.5 rounded-full bg-gray-700/80 text-white hover:bg-gray-600/80 transition-colors"
                                title={showOriginal ? 'Mostrar tradução' : 'Mostrar original'}
                            >
                                {showOriginal ? 'TRAD' : 'ORIG'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
);
}
export default ChatMessage;
