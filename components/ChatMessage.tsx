import React from 'react';
import type { ChatMessage } from '../types';
import { Player } from '@lottiefiles/react-lottie-player';

interface ChatMessageItemProps {
  message: ChatMessage;
  onUserClick: (userId: number) => void;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, onUserClick }) => {
  if (message.type === 'entry') {
     if (message.badgeText) {
        return (
            <div className="relative py-1 self-start animate-slide-in-bottom">
                <div className="relative z-10 bg-gradient-to-r from-purple-600/80 to-red-500/80 px-3 py-1.5 rounded-2xl flex items-center gap-2">
                    <div className="bg-purple-900/50 px-2 py-1 rounded-md text-sm font-bold flex items-center gap-1.5 text-white">
                        <span className="w-4 h-4 bg-purple-400 rounded-sm inline-block"></span>
                        {message.badgeText}
                    </div>
                    <button onClick={() => onUserClick(message.userId)} className="font-semibold text-white">{message.username}</button>
                    <span className="text-gray-200 text-sm">{message.message}</span>
                </div>
            </div>
        )
    }
    return (
      <div className="bg-black/50 backdrop-blur-sm px-4 py-1.5 rounded-full self-start text-sm shadow-lg animate-slide-in-bottom">
        <button onClick={() => onUserClick(message.userId)} className="font-semibold text-cyan-300">{message.username}</button>
        <span className="text-gray-200 ml-1.5">{message.message}</span>
      </div>
    );
  }

  if (message.type === 'special_entry') {
    return (
      <div className="w-full max-w-sm self-start my-1 animate-slide-in-bottom">
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 p-0.5 rounded-xl shadow-lg">
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-[10px] p-2 flex items-center gap-3">
            {message.giftAnimationUrl && (
              <img src={message.giftAnimationUrl} alt={message.giftName || 'Effect'} className="w-12 h-12" />
            )}
            <p className="text-sm">
              <span className="font-bold text-white drop-shadow-sm">{message.username}</span>
              <span className="text-gray-200"> {message.message}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (message.type === 'gift') {
    return (
       <div className="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500/80 border-2 border-yellow-300 backdrop-blur-sm p-2 rounded-xl self-start shadow-lg flex items-center gap-3 w-auto max-w-sm animate-slide-in-bottom">
        <button onClick={() => onUserClick(message.userId)} className="font-semibold text-yellow-900 drop-shadow-sm">{message.username}</button>
        <span className="text-sm text-yellow-800 drop-shadow-sm">{message.message}</span>
        {message.giftAnimationUrl && (
            <Player
                src={message.giftAnimationUrl}
                className="w-12 h-12 ml-auto"
                autoplay
                loop
            />
        )}
      </div>
    )
  }
  
  if (message.type === 'levelup') {
    return (
      <div className="w-full max-w-sm self-start my-1 animate-slide-in-bottom">
        <div className="bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500 p-0.5 rounded-xl shadow-lg">
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-[10px] p-2 flex items-center justify-center gap-3">
            <span className="text-2xl">🎉</span>
            <p className="text-sm font-bold text-center">
              <span className="text-white drop-shadow-sm">{message.username}</span>
              <span className="text-cyan-200"> {message.message}</span>
            </p>
             <span className="text-2xl">🎉</span>
          </div>
        </div>
      </div>
    );
  }

  if (message.type === 'announcement') {
    return (
        <div className="relative py-1 self-start animate-slide-in-bottom">
            <div className="relative z-10 bg-gradient-to-r from-blue-500/80 to-pink-500/80 px-3 py-1.5 rounded-full">
                <p className="text-white text-sm">{message.message}</p>
            </div>
        </div>
    )
  }

  return (
     <div className="relative py-1 self-start animate-slide-in-bottom max-w-[80%]">
        <div className="relative z-10 bg-gradient-to-r from-purple-600/70 to-fuchsia-500/70 px-3 py-1.5 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2">
                {message.level && (
                    <div className="bg-orange-500/90 px-1.5 py-0.5 rounded-md text-xs font-bold flex items-center gap-1 text-white shrink-0">
                        Nv. {message.level}
                    </div>
                )}
                <button onClick={() => onUserClick(message.userId)} className="font-bold text-sm text-white truncate">{message.username}</button>
                {message.emojis && <span className="text-sm -ml-1">{message.emojis}</span>}
            </div>
            <p className="text-white mt-1 break-words text-base pl-1">{message.message}</p>
        </div>
    </div>
  );
};

export default ChatMessageItem;