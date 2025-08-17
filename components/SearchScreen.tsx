import React, { useState, useEffect, useCallback } from 'react';
import type { User, AppView, Stream, PkBattle } from '../types';
import * as authService from '../services/authService';
import { useApiViewer } from './ApiContext';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import SearchIcon from './icons/SearchIcon';
import UserProfileModal from './UserProfileModal';

interface SearchScreenProps {
  currentUser: User;
  onExit: () => void;
  onUpdateUser: (user: User) => void;
  onNavigateToChat: (userId: number) => void;
  onViewProtectors: (userId: number) => void;
  onViewStream: (stream: Stream | PkBattle) => void;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ currentUser, onExit, onUpdateUser, onNavigateToChat, onViewProtectors, onViewStream }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<number | null>(null);
  const { showApiResponse } = useApiViewer();

  const performSearch = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const users = await authService.searchUsers(searchQuery);
      showApiResponse(`GET /api/users/search?q=${searchQuery}`, users);
      setResults(users);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [showApiResponse]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const handler = setTimeout(() => {
      performSearch(query);
    }, 300); // Debounce search

    return () => {
      clearTimeout(handler);
    };
  }, [query, performSearch]);


  const handleUserClick = (userId: number) => {
    setViewingUserId(userId);
  };

  return (
    <>
      <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
        <header className="p-4 flex items-center gap-2 shrink-0 border-b border-gray-800">
          <button onClick={onExit} className="p-2 -m-2"><ArrowLeftIcon className="w-6 h-6"/></button>
          <div className="relative flex-grow">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome ou ID"
              className="w-full bg-[#1c1c1c] h-10 rounded-full pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
            />
          </div>
        </header>

        <main className="flex-grow overflow-y-auto scrollbar-hide">
          {isLoading ? (
            <div className="text-center text-gray-400 pt-10">Buscando...</div>
          ) : results.length > 0 ? (
            <div className="p-2">
              {results.map(user => (
                <button key={user.id} onClick={() => handleUserClick(user.id)} className="w-full text-left p-2 flex items-center gap-4 hover:bg-gray-800/50 transition-colors rounded-lg">
                  <img src={user.avatar_url || 'https://i.pravatar.cc/150?u=' + user.id} alt={user.name} className="w-14 h-14 rounded-full object-cover" />
                  <div className="flex-grow overflow-hidden">
                    <h2 className="font-semibold text-white truncate">{user.nickname || user.name}</h2>
                    <p className="truncate text-sm text-gray-400">ID: {user.id}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim() && !isLoading ? (
            <div className="text-center text-gray-500 pt-20">
                <p>Nenhum usuário encontrado para "{query}"</p>
            </div>
          ) : (
             <div className="text-center text-gray-500 pt-20">
                <p>Encontre usuários por nome ou ID.</p>
            </div>
          )}
        </main>
      </div>

      {viewingUserId && (
        <UserProfileModal
          userId={viewingUserId}
          currentUser={currentUser}
          onUpdateUser={onUpdateUser}
          onClose={() => setViewingUserId(null)}
          onNavigateToChat={onNavigateToChat}
          onViewProtectors={onViewProtectors}
          onViewStream={onViewStream}
        />
      )}
    </>
  );
};

export default SearchScreen;