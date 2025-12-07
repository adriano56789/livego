import React, { useState, useMemo, useCallback, memo } from 'react';
import { TranslateIcon, FanBadgeIcon } from '../icons';
import { avatarFrames, getRemainingDays, getFrameGlowClass } from '../../services/database';
import { User } from '../../types';

interface ChatMessageProps {
    userObject: User;
    message: string | React.ReactNode;
    translatedText?: string;
    onAvatarClick: () => void;
    streamerId: string;
    onTranslate?: (text: string) => Promise<string>;
    isTranslated?: boolean;
    originalLanguage?: string;
    targetLanguage?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = memo(({
    userObject,
    message,
    translatedText: propTranslatedText,
    onAvatarClick,
    streamerId,
    onTranslate,
    isTranslated = false,
    originalLanguage,
    targetLanguage = 'pt'
}) => {
    const { name: user, level, avatarUrl, activeFrameId, ownedFrames, rank, fanClub } = userObject;
    const [isTranslating, setIsTranslating] = useState(false);
    const [localTranslatedText, setLocalTranslatedText] = useState(propTranslatedText || '');
    const [showOriginal, setShowOriginal] = useState(false);
    const [isLocallyTranslated, setIsLocallyTranslated] = useState(false);

    const activeOwnedFrame = ownedFrames?.find(f => f.frameId === activeFrameId);
    const remainingDays = getRemainingDays(activeOwnedFrame?.expirationDate);

    const activeFrame = (activeFrameId && activeOwnedFrame && remainingDays > 0)
        ? avatarFrames.find(f => f.id === activeFrameId)
        : null;
    const ActiveFrameComponent = activeFrame ? activeFrame.component : null;
    const frameGlowClass = getFrameGlowClass(activeFrameId);

    const finalTranslatedText = propTranslatedText || localTranslatedText;
    const canBeTranslated = (finalTranslatedText && finalTranslatedText !== message) || onTranslate;
    const textToShow = ((isTranslated || isLocallyTranslated) && finalTranslatedText && !showOriginal) ? finalTranslatedText : message;

    const isFan = fanClub && fanClub.streamerId === streamerId;

    const renderMessageWithMentions = useCallback((text: string | React.ReactNode): React.ReactNode => {
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
    }, []);

    const toggleOriginal = useCallback(() => {
        setShowOriginal(prev => !prev);
    }, []);

    const handleTranslate = useCallback(async () => {
        if (!finalTranslatedText && onTranslate && typeof message === 'string') {
            try {
                setIsTranslating(true);
                const result = await onTranslate(message);
                setLocalTranslatedText(result);
                setIsLocallyTranslated(true);
            } catch (error) {
                console.error('Translation error:', error);
            } finally {
                setIsTranslating(false);
            }
        } else {
            setIsLocallyTranslated(prev => !prev);
        }
    }, [finalTranslatedText, message, onTranslate]);

    const messageContent = useMemo(() => (
        <p className="text-white break-words">
            {renderMessageWithMentions(textToShow)}
            {isTranslating && (
                <span className="ml-2 text-xs text-gray-400">Traduzindo...</span>
            )}
        </p>
    ), [isTranslating, renderMessageWithMentions, textToShow]);

    const translateButton = useMemo(() => (
        <button
            onClick={handleTranslate}
            disabled={isTranslating}
            className="w-5 h-5 rounded-full bg-purple-600/80 flex items-center justify-center hover:bg-purple-500/80 transition-colors"
            title="Traduzir mensagem"
        >
            <TranslateIcon className="w-3 h-3 text-white" />
        </button>
    ), [handleTranslate, isTranslating]);

    const toggleTranslationButton = useMemo(() => (
        finalTranslatedText && (
            <button
                onClick={toggleOriginal}
                className="text-xs px-2 py-0.5 rounded-full bg-gray-700/80 text-white hover:bg-gray-600/80 transition-colors"
                title={showOriginal ? 'Mostrar tradução' : 'Mostrar original'}
            >
                {showOriginal ? 'TRAD' : 'ORIG'}
            </button>
        )
    ), [finalTranslatedText, showOriginal, toggleOriginal]);

    // Memoize o componente de avatar para evitar re-renderizações desnecessárias
    const avatarComponent = useMemo(() => (
        <button 
            onClick={onAvatarClick} 
            className="relative w-8 h-8 flex-shrink-0 self-start"
            aria-label={`Perfil de ${user}`}
        >
            <img 
                src={avatarUrl} 
                alt={user} 
                className="w-full h-full rounded-full object-cover"
                loading="lazy"
            />
            {ActiveFrameComponent && (
                <div className={`absolute -top-1 -left-1 w-10 h-10 pointer-events-none ${frameGlowClass}`}>
                    <ActiveFrameComponent />
                </div>
            )}
        </button>
    ), [ActiveFrameComponent, avatarUrl, frameGlowClass, onAvatarClick, user]);

    // Memoize o badge de fã
    const fanBadge = useMemo(() => (
        isFan && fanClub ? (
            <FanBadgeIcon
                level={fanClub.level}
                streamerName={fanClub.streamerName}
            />
        ) : (
            <span className="level-badge">
                <span>💎</span>
                <span className="ml-1">{level}</span>
            </span>
        )
    ), [isFan, fanClub, level]);

    // Memoize o rank
    const rankBadge = useMemo(() => (
        rank && rank > 0 && rank <= 3 && (
            <span className="rank-badge ml-1.5">{rank}</span>
        )
    ), [rank]);

    // Memoize o botão de tradução flutuante
    const floatingTranslateButton = useMemo(() => (
        onTranslate && typeof message === 'string' && (
            <div className="absolute right-0 -top-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {translateButton}
                {toggleTranslationButton}
            </div>
        )
    ), [onTranslate, message, translateButton, toggleTranslationButton]);

    // Memoize o botão de alternar tradução
    const toggleTranslateButtonMemo = useMemo(() => (
        canBeTranslated && (
            <button
                onClick={() => onTranslate && setIsLocallyTranslated(p => !p)}
                className="bg-black/30 rounded-full w-5 h-5 p-0.5 hover:bg-black/50 transition-colors inline-flex items-center justify-center align-middle ml-1.5"
                title={isLocallyTranslated ? "Mostrar original" : "Traduzir"}
            >
                <TranslateIcon className="w-full h-full text-white/80" />
            </button>
        )
    ), [canBeTranslated, isLocallyTranslated, onTranslate]);

    return (
        <div className="relative self-start text-xs mt-1">
            <div className="chat-bubble">
                {avatarComponent}
                <div className="min-w-0 flex items-baseline flex-wrap gap-x-1.5 leading-snug">
                    {fanBadge}
                    {rankBadge}
                    {!isFan && (
                        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-2 mt-1 inline-block shadow-lg shadow-black/50 relative group">
                            {messageContent}
                            {floatingTranslateButton}
                        </div>
                    )}
                    {toggleTranslateButtonMemo}
                </div>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Função de comparação para o React.memo
    return (
        prevProps.message === nextProps.message &&
        prevProps.translatedText === nextProps.translatedText &&
        prevProps.isTranslated === nextProps.isTranslated &&
        prevProps.userObject.id === nextProps.userObject.id &&
        prevProps.userObject.avatarUrl === nextProps.userObject.avatarUrl &&
        prevProps.userObject.level === nextProps.userObject.level &&
        prevProps.userObject.rank === nextProps.userObject.rank &&
        prevProps.userObject.fanClub?.level === nextProps.userObject.fanClub?.level
    );
});

export default ChatMessage;