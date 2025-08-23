

import React from 'react';
import type { ChatMessage } from '../types';
import FancyChatBubble from './FancyChatBubble';
import ProfileBadge from './ProfileBadge';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';

interface ChatMessageItemProps {
  message: ChatMessage;
  onUserClick: (userId: number) => void;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, onUserClick }) => {
  if (message.type === 'entry') {
    return (
        <div className="p-1.5 self-start animate-slide-in-bottom">
            <button 
                onClick={() => onUserClick(message.userId)} 
                className="bg-black/40 backdrop-blur-sm rounded-full p-1 pr-4 flex items-center gap-2"
            >
                <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden shrink-0">
                    {message.avatarUrl ? <img src={message.avatarUrl} alt={message.username} className="w-full h-full object-cover" /> : <UserPlaceholderIcon className="w-full h-full p-1 text-gray-500"/>}
                </div>
                <span className="font-semibold text-sm text-white truncate max-w-[120px]">{message.username}</span>
                {message.level && <ProfileBadge badge={{ text: String(message.level), type: 'level' }} />}
                {message.age && message.gender && <ProfileBadge badge={{ text: String(message.age), type: 'gender_age', icon: message.gender }} />}
                <span className="text-sm text-gray-300 ml-1">entrou</span>
            </button>
        </div>
    );
  }

  if (message.type === 'special_entry') {
    return (
        <div className="text-sm text-center py-1 self-center animate-fade-in-fast">
            <FancyChatBubble>
                <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">Bem-vindo </span>
                    <button onClick={() => onUserClick(message.userId)} className="font-bold text-yellow-300">{message.username}</button>
                    <span className="text-white">à sala!</span>
                </div>
            </FancyChatBubble>
        </div>
    )
  }

  if (message.type === 'gift') {
    return (
      <div className="text-sm flex items-center gap-2 self-start animate-slide-in-bottom">
        <button onClick={() => onUserClick(message.userId)} className="font-semibold text-cyan-300">{message.username}</button>
        <span className="text-gray-300">{message.message}</span>
        {message.giftImageUrl && (
             <img src={message.giftImageUrl} alt={message.giftName} className="w-8 h-8" />
        )}
      </div>
    );
  }

  if (message.type === 'image') {
    return (
      <div className="p-1.5 self-start animate-slide-in-bottom max-w-[70%] sm:max-w-[50%] flex items-start gap-2">
        <button onClick={() => onUserClick(message.userId)} className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden shrink-0">
            {message.avatarUrl ? <img src={message.avatarUrl} alt={message.username} className="w-full h-full object-cover" /> : <UserPlaceholderIcon className="w-full h-full p-1 text-gray-500"/>}
        </button>
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-2 flex-grow">
            <div className="flex items-center gap-2 mb-1">
                <button onClick={() => onUserClick(message.userId)} className="font-semibold text-sm text-gray-300 truncate">{message.username}</button>
                {message.level && <ProfileBadge badge={{ text: String(message.level), type: 'level' }} />}
                {message.age && message.gender && <ProfileBadge badge={{ text: String(message.age), type: 'gender_age', icon: message.gender }} />}
            </div>
            <a href={message.imageUrl} target="_blank" rel="noopener noreferrer">
                <img src={message.imageUrl} alt="Imagem enviada" className="rounded-lg max-w-full h-auto max-h-48" />
            </a>
        </div>
      </div>
    );
  }
  
  if (message.type === 'announcement') {
      return (
          <div className="text-sm text-center text-yellow-300 bg-yellow-900/40 py-1 px-3 rounded-full self-center my-1 animate-fade-in-fast">
              📢 {message.message}
          </div>
      );
  }

  if (message.type === 'levelup') {
      return (
          <div className="text-sm text-center text-green-300 bg-green-900/40 py-1 px-3 rounded-full self-center my-1 animate-fade-in-fast">
              🎉 <button onClick={() => onUserClick(message.userId)} className="font-semibold">{message.username}</button> alcançou o nível {message.level}!
          </div>
      );
  }

  // Default 'message' type
  return (
    <div className="p-1.5 self-start animate-slide-in-bottom max-w-[85%] sm:max-w-[70%] flex items-start gap-2">
      <button onClick={() => onUserClick(message.userId)} className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden shrink-0">
          {message.avatarUrl ? <img src={message.avatarUrl} alt={message.username} className="w-full h-full object-cover" /> : <UserPlaceholderIcon className="w-full h-full p-1 text-gray-500"/>}
      </button>
      <div className="bg-black/40 backdrop-blur-sm rounded-xl p-2 flex-grow">
          <div className="flex items-center gap-2 mb-1">
              <button onClick={() => onUserClick(message.userId)} className="font-semibold text-sm text-gray-300 truncate">{message.username}</button>
              {message.level && <ProfileBadge badge={{ text: String(message.level), type: 'level' }} />}
              {message.age && message.gender && <ProfileBadge badge={{ text: String(message.age), type: 'gender_age', icon: message.gender }} />}
          </div>
          <p className="text-white text-base break-words">{message.message}</p>
      </div>
    </div>
  );
};

export default ChatMessageItem;
