import React from 'react';
import type { ChatMessage } from '../types';
import { Player } from '@lottiefiles/react-lottie-player';

interface ChatMessageItemProps {
  message: ChatMessage;
  onUserClick: (userId: number) => void;
}

const Flourish: React.FC<{ className?: string }> = ({ className }) => (
    <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M2.52161 15.8972C-0.548942 12.045 -0.211833 6.27375 3.51893 3.03375C7.24968 -0.206249 12.8753 -0.563333 16.7972 2.50721C18.3283 3.69471 20.354 5.99221 21.054 7.39471C21.419 8.12221 22.0166 9.31721 21.7828 10.2222C21.1496 12.7872 17.9103 12.5534 15.6843 12.3847" stroke="url(#paint0_linear_chat)" strokeWidth="1.5" strokeLinecap="round"/>
        <defs>
            <linearGradient id="paint0_linear_chat" x1="2.0003" y1="1.99999" x2="20.73" y2="15.2015" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F472B6" stopOpacity="0.8"/>
                <stop offset="1" stopColor="#A78BFA" stopOpacity="0.8"/>
            </linearGradient>
        </defs>
    </svg>
);


const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, onUserClick }) => {
  if (message.type === 'entry') {
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

  return (
     <div className="relative py-2 px-1 backdrop-blur-sm animate-slide-in-bottom">
        {/* Flourishes for decoration */}
        <Flourish className="absolute top-0 left-0 w-4 h-4" />
        <Flourish className="absolute bottom-0 right-0 w-4 h-4 transform scale-x-[-1] scale-y-[-1]" />

        <div className="relative z-10 bg-gradient-to-r from-pink-600/70 to-purple-600/70 px-3 py-1.5 rounded-2xl">
            <div className="flex items-center gap-2">
                <div className={`bg-orange-500/80 px-1.5 py-0.5 rounded-md text-xs font-bold flex items-center gap-1 text-white`}>
                Nv. {message.level}
                </div>
                <button onClick={() => onUserClick(message.userId)} className={`font-bold text-sm text-white`}>{message.username}</button>
                <span className="text-sm -ml-1">{message.emojis}</span>
            </div>
            <p className="text-white mt-1 break-words text-base pl-1">{message.message}</p>
        </div>
    </div>
  );
};

export default ChatMessageItem;