import React, { useState, useEffect } from 'react';
import type { User, AppView, Conversation } from '../types';
import { getConversations } from '../services/authService';
import { useApiViewer } from './ApiContext';
import SearchIcon from './icons/SearchIcon';
import PlusIcon from './icons/PlusIcon';
import ConversationListItem from './ConversationListItem';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

interface MessagesScreenProps {
  user: User;
  onNavigate: (view: AppView) => void;
  onNavigateToChat: (userId: number) => void;
}

const MessagesScreen: React.FC<MessagesScreenProps> = ({ user, onNavigate, onNavigateToChat }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showApiResponse } = useApiViewer();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const convos = await getConversations(user.id);
        setConversations(convos);
        showApiResponse(`GET /api/conversations/${user.id}`, convos);
      } catch (err) {
        setError("Não foi possível carregar as mensagens.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
  }, [user.id, showApiResponse]);

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center text-gray-400 pt-10">Carregando conversas...</div>;
    }
    if (error) {
      return <div className="text-center text-red-400 pt-10">{error}</div>;
    }
    if (conversations.length === 0) {
      return <div className="text-center text-gray-500 pt-10">Nenhuma mensagem encontrada.</div>;
    }
    return (
      <div className="divide-y divide-gray-800">
        {conversations.map(convo => (
          <ConversationListItem 
            key={convo.id} 
            conversation={convo} 
            onClick={() => onNavigateToChat(convo.otherUserId)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-[#121212] text-white h-full flex flex-col font-sans">
      <header className="px-4 pt-6 pb-3 flex items-center justify-between shrink-0 bg-[#1c1c1c] border-b border-gray-800">
        <button onClick={() => onNavigate('feed')}>
          <ArrowLeftIcon className="w-6 h-6"/>
        </button>
        <h1 className="text-xl font-bold">Mensagens</h1>
        <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('search')}><SearchIcon className="w-6 h-6"/></button>
            <button onClick={() => alert('Nova mensagem não implementado')}><PlusIcon className="w-6 h-6"/></button>
        </div>
      </header>
      <main className="flex-grow overflow-y-auto scrollbar-hide">
        {renderContent()}
      </main>
    </div>
  );
};

export default MessagesScreen;