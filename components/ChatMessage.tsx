
import React from 'react';
import type { ChatMessage } from '../types';
import { Player } from '@lottiefiles/react-lottie-player';
import FancyChatBubble from './FancyChatBubble';
import ProfileBadge from './ProfileBadge';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';

interface ChatMessageItemProps {
  message: ChatMessage;
  onUserClick: (userId: number) => void;
  isPkMode?: boolean;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, onUserClick, isPkMode }) => {

  if (message.type === 'entry') {
    return (
      <div className="p-1 self-start animate-slide-in-bottom">
        <span className="bg-black/40 rounded-full py-1.5 px-3 text-xs text-gray-300">
          <button onClick={() => onUserClick(message.userId)} className="font-semibold text-white truncate max-w-[100px] mr-1">{message.username}</button>
          entrou
        </span>
      </div>
    );
  }

  if (message.type === 'special_entry') {
    return (
        <div className="text-center py-1 self-center animate-fade-in-fast text-sm">
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
      <div className="flex items-start gap-1.5 animate-slide-in-bottom max-w-[90%] self-start">
        <button onClick={() => onUserClick(message.userId)} className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden shrink-0">
          {message.avatarUrl ? <img src={message.avatarUrl} alt={message.username} className="w-full h-full object-cover" /> : <UserPlaceholderIcon className="w-full h-full p-1 text-gray-500"/>}
        </button>
        <div className="flex-grow bg-black/40 rounded-lg px-2.5 py-1.5">
          <div className="flex items-center gap-1.5">
            <button onClick={() => onUserClick(message.userId)} className="text-xs text-gray-300 font-medium">{message.username}</button>
            {message.globalLevel && <ProfileBadge badge={{ text: String(message.globalLevel), type: 'level' }} />}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-sm text-white break-words flex items-center gap-1.5">
              {message.message}
              {message.giftImageUrl && <img src={message.giftImageUrl} alt={message.giftName || ''} className="w-7 h-7 object-contain inline-block" />}
            </p>
            {message.quantity && message.quantity > 1 && (
              <div className="font-black italic text-yellow-300 drop-shadow-lg animate-combo-thump text-2xl ml-2">
                <span className="text-base font-semibold not-italic">x</span>{message.quantity}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (message.type === 'image') {
    return (
      <div className="flex items-start gap-1.5 animate-slide-in-bottom max-w-[90%] self-start">
        <button onClick={() => onUserClick(message.userId)} className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden shrink-0">
            {message.avatarUrl ? <img src={message.avatarUrl} alt={message.username} className="w-full h-full object-cover" /> : <UserPlaceholderIcon className="w-full h-full p-1 text-gray-500"/>}
        </button>
        <div className="flex-grow bg-black/40 rounded-lg p-2">
            <div className="flex items-center gap-1.5 mb-1 px-1">
                <button onClick={() => onUserClick(message.userId)} className="text-xs text-gray-300 font-medium">{message.username}</button>
                {message.globalLevel && <ProfileBadge badge={{ text: String(message.globalLevel), type: 'level' }} />}
                {message.age && message.gender && <ProfileBadge badge={{ text: String(message.age), type: 'gender_age', icon: message.gender }} />}
            </div>
            <a href={message.imageUrl} target="_blank" rel="noopener noreferrer">
                <img src={message.imageUrl} alt="Imagem enviada" className="rounded-md max-w-full h-auto max-h-40" />
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
              🎉 <button onClick={() => onUserClick(message.userId)} className="font-semibold">{message.username}</button> alcançou o nível {message.globalLevel}!
          </div>
      );
  }

  // Default 'message' type
  return (
    <div className="flex items-start gap-1.5 animate-slide-in-bottom max-w-[90%] self-start">
      <button onClick={() => onUserClick(message.userId)} className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden shrink-0">
          {message.avatarUrl ? <img src={message.avatarUrl} alt={message.username} className="w-full h-full object-cover" /> : <UserPlaceholderIcon className="w-full h-full p-1 text-gray-500"/>}
      </button>
      <div className="flex-grow bg-black/40 rounded-lg px-2.5 py-1.5">
          <div className="flex items-center gap-1.5">
              <button onClick={() => onUserClick(message.userId)} className="text-xs text-gray-300 font-medium">{message.username}</button>
              {message.globalLevel && <ProfileBadge badge={{ text: String(message.globalLevel), type: 'level' }} />}
              {message.age && message.gender && <ProfileBadge badge={{ text: String(message.age), type: 'gender_age', icon: message.gender }} />}
          </div>
          <p className="text-sm text-white break-words mt-0.5">{message.message}</p>
      </div>
    </div>
  );
};

export default ChatMessageItem;