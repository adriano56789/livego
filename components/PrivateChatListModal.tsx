import React, { useState, useEffect } from 'react';
import type { User, Conversation } from '../types';
import * as authService from '../services/authService';
import ConversationListItem from './ConversationListItem';
import CrossIcon from './icons/CrossIcon';
import MessageIcon from './icons/MessageIcon';

interface PrivateChatListModalProps {
  currentUser: User;
  onClose: () => void;
  onOpenConversation: (conversationId: string) => void;
}

const PrivateChatListModal: React.FC<PrivateChatListModalProps> = ({ currentUser, onClose, onOpenConversation }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const convos = await authService.getConversations(currentUser.id);
        // Filtra o resumo de pedidos de amizade, mostrando apenas chats reais.
        setConversations(convos.filter(c => c.type !== 'friend_requests_summary'));
      } catch (err) {
        setError("Não foi possível carregar as mensagens.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
  }, [currentUser.id]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={onClose}>
      <div 
        className="bg-[#1C1F24] w-full h-[70vh] max-h-[550px] rounded-t-2xl flex flex-col text-white animate-slide-up-fast"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="w-6 h-6"></div>
          <h2 className="text-lg font-bold">Bate-papo Privado</h2>
          <button onClick={onClose}><CrossIcon className="w-6 h-6 text-gray-400" /></button>
        </header>
        <main className="flex-grow overflow-y-auto scrollbar-hide">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-gray-400">Carregando...</div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-400">{error}</div>
          ) : conversations.length > 0 ? (
            <div className="divide-y divide-gray-800">
              {conversations.map(convo => (
                <ConversationListItem
                  key={convo.id}
                  conversation={convo}
                  onClick={() => onOpenConversation(convo.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 px-4">
              <MessageIcon className="w-20 h-20 mb-4 opacity-30" />
              <h3 className="text-xl font-bold text-gray-300">Nenhuma conversa</h3>
              <p className="mt-2">Você ainda não tem conversas privadas.</p>
            </div>
          )}
        </main>
      </div>
       <style>{`
        @keyframes slide-up-fast { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up-fast { animation: slide-up-fast 0.25s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default PrivateChatListModal;