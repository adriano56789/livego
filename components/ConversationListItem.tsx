

import React from 'react';
import type { Conversation } from '../types';
import UsersIcon from './icons/UsersIcon';

interface ConversationListItemProps {
  conversation: Conversation;
  onClick: () => void;
}

const ConversationListItem: React.FC<ConversationListItemProps> = ({ conversation, onClick }) => {
  const messages = conversation.messages || [];
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'agora';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h`;
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };


  return (
    <button onClick={onClick} className="w-full text-left p-4 flex items-center gap-4 hover:bg-gray-800/50 transition-colors">
      <div className="relative shrink-0">
        <img src={conversation.otherUserAvatarUrl} alt={conversation.otherUserName} className="w-14 h-14 rounded-full object-cover" />
        {conversation.unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center border-2 border-[#121212]">
            {conversation.unreadCount}
          </span>
        )}
      </div>
      <div className="flex-grow overflow-hidden">
        <div className="flex justify-between items-baseline">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-white truncate">{conversation.otherUserName}</h2>
              {conversation.isFriend && <UsersIcon className="w-4 h-4 text-yellow-400 shrink-0" />}
            </div>
            <span className="text-xs text-gray-500 shrink-0 ml-2">{lastMessage ? formatTimestamp(lastMessage.timestamp) : ''}</span>
        </div>
        <p className={`truncate text-sm ${conversation.unreadCount > 0 ? 'text-gray-300' : 'text-gray-500'}`}>
            {lastMessage ? lastMessage.text : 'Nenhuma mensagem ainda.'}
        </p>
      </div>
    </button>
  );
};

export default ConversationListItem;
