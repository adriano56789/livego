import React, { useState } from 'react';
import { User } from '../types';
import { BackIcon, SearchIcon, PlusIcon } from './icons';
import { useTranslation } from '../i18n';

interface SearchScreenProps {
  onClose: () => void;
  onViewProfile: (user: User) => void;
  allUsers: User[];
  onFollowUser: (user: User) => void;
}

const UserItem: React.FC<{ user: User; onViewProfile: (user: User) => void; onFollow: (user: User) => void; }> = ({ user, onViewProfile, onFollow }) => {
    const { t } = useTranslation();

    const handleFollow = (e: React.MouseEvent) => {
        e.stopPropagation();
        onFollow(user);
    };

    return (
        <div className="flex items-center justify-between p-4 hover:bg-gray-800/50 cursor-pointer" onClick={() => onViewProfile(user)}>
            <div className="flex items-center space-x-4 min-w-0">
                <img src={user.avatarUrl} alt={user.name} className="w-14 h-14 rounded-full object-cover" />
                <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">{user.name}</h3>
                    <p className="text-sm text-gray-400">{t('profile.id')}: {user.identification}</p>
                </div>
            </div>
            <button
                onClick={handleFollow}
                className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-colors flex items-center space-x-1 shrink-0 ${
                    user.isFollowed
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
            >
                {!user.isFollowed && <PlusIcon className="w-4 h-4" />}
                <span>{user.isFollowed ? t('common.following') : t('common.follow')}</span>
            </button>
        </div>
    );
};


const SearchScreen: React.FC<SearchScreenProps> = ({ onClose, onViewProfile, allUsers, onFollowUser }) => {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);

    const handleSearch = (searchQuery: string) => {
        setQuery(searchQuery);
        if (searchQuery.trim() === '') {
            setResults([]);
            return;
        }
        
        const lowerCaseQuery = searchQuery.toLowerCase();
        const filtered = allUsers.filter(user => 
            user.name.toLowerCase().includes(lowerCaseQuery) || 
            user.identification.toLowerCase().includes(lowerCaseQuery)
        );
        setResults(filtered);
    };

    return (
        <div className="absolute inset-0 bg-[#111] z-50 flex flex-col text-white">
            <header className="flex items-center p-4 border-b border-gray-800 flex-shrink-0 space-x-4">
                <button onClick={onClose}>
                    <BackIcon className="w-6 h-6" />
                </button>
                <div className="relative flex-grow">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('search.placeholder')}
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full bg-[#2C2C2E] text-white placeholder-gray-400 rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        autoFocus
                    />
                </div>
            </header>
            <main className="flex-grow overflow-y-auto no-scrollbar">
                {query && results.length > 0 && (
                    results.map(user => <UserItem key={user.id} user={user} onViewProfile={onViewProfile} onFollow={onFollowUser} />)
                )}
                {query && results.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
                        <p>{t('search.noResults')}</p>
                        <p className="text-sm">{t('search.tryAgain')}</p>
                    </div>
                )}
                 {!query && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
                        <SearchIcon className="w-16 h-16 mb-4" />
                        <p>{t('search.prompt')}</p>
                    </div>
                 )}
            </main>
        </div>
    );
};

export default SearchScreen;