

import React from 'react';
import { Conversation, User } from '../types';
import { CloseIcon } from './icons';

interface PrivateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (user: User) => void;
  conversations: Conversation[];
}

// Reusing ConversationItem from MessagesScreen logic
const LevelBadge: React.FC<{ level: number }> = ({ level }) => (
    <span className="bg-pink-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center">
        ♀ {level}
    </span>
);

const RankBadge: React.FC<{ rank: number }> = ({ rank }) => (
    <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center">
        🔥 {rank}
    </span>
);

const ConversationItem: React.FC<{ conversation: Conversation; onClick: () => void }> = ({ conversation, onClick }) => (
    <div className="flex items-center p-4 space-x-4 cursor-pointer hover:bg-gray-800/50" onClick={onClick}>
        <img src={conversation.friend.avatarUrl} alt={conversation.friend.name} className="w-14 h-14 rounded-full object-cover" />
        <div className="flex-grow">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-white">{conversation.friend.name}</h3>
                <span className="text-xs text-gray-500">{conversation.timestamp}</span>
            </div>
            <div className="flex items-center space-x-1.5 mt-1">
                <LevelBadge level={conversation.friend.level} />
                {conversation.friend.rank && <RankBadge rank={conversation.friend.rank} />}
            </div>
            <p className="text-sm text-gray-400 mt-1 truncate">{conversation.lastMessage}</p>
        </div>
    </div>
);


const PrivateChatModal: React.FC<PrivateChatModalProps> = ({ isOpen, onClose, onStartChat, conversations }) => {
  const handleStartChat = (user: User) => {
    onStartChat(user);
  };
  
  return (
    <div 
      className={`absolute inset-0 z-[100] flex items-end justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose}
    >
      <div
        className={`bg-[#1C1C1E] w-full max-w-md h-3/4 rounded-t-2xl p-3 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between mb-3 pb-3 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-200">Mensagens Privadas</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>
        <div className="flex-grow overflow-y-auto no-scrollbar">
            {conversations.map(convo => (
                <ConversationItem key={convo.id} conversation={convo} onClick={() => handleStartChat(convo.friend)} />
            ))}
            {conversations.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-500">
                    <p>Nenhuma mensagem.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PrivateChatModal;