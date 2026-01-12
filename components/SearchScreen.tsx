import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, SearchIcon, TrashIcon } from './icons';
import { api } from '../services/api';
import { User, Streamer } from '../types';
import { LoadingSpinner } from './Loading';
import { LevelBadge } from './LevelBadge';

interface SearchScreenProps {
    onClose: () => void;
    mode?: 'stream' | 'user';
    onUserSelected?: (user: User) => void;
    onStreamSelected?: (stream: Streamer) => void;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ onClose, mode = 'user', onUserSelected, onStreamSelected }) => {
    const [query, setQuery] = useState('');
    const [history, setHistory] = useState(['5582931', 'Mirella', 'LiveGo', 'VIP']);
    const [userResults, setUserResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (query.length >= 2) {
            const delay = setTimeout(async () => {
                setIsSearching(true);
                try {
                    const results = await api.users.search(query);
                    setUserResults(Array.isArray(results) ? results : []);
                } catch (e) {
                    console.error("Erro na busca Mocha:", e);
                    setUserResults([]);
                } finally {
                    setIsSearching(false);
                }
            }, 400);
            return () => clearTimeout(delay);
        } else {
            setUserResults([]);
        }
    }, [query]);

    const handleUserClick = (user: User) => {
        if (onUserSelected) onUserSelected(user);
    };

    return (
        <div className="fixed inset-0 bg-[#121212] z-[150] flex flex-col font-sans animate-in slide-in-from-right duration-300">
            <div className="flex items-center p-3 gap-3 pt-12 border-b border-white/5 bg-[#121212]">
                <button onClick={onClose} className="p-2 -ml-2">
                    <ChevronLeftIcon className="text-white w-6 h-6" />
                </button>
                <div className="flex-1 bg-white/5 rounded-full flex items-center px-4 py-2 border border-white/10 focus-within:border-purple-500/50 transition-all">
                    <SearchIcon className="text-gray-500 w-4 h-4 mr-3" />
                    <input 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={mode === 'user' ? "ID de 8 dígitos ou apelido..." : "Nome da transmissão..."} 
                        autoFocus 
                        className="bg-transparent text-white text-sm w-full outline-none placeholder-gray-600 font-medium"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar bg-[#121212]">
                {isSearching ? (
                    <div className="flex flex-col items-center justify-center mt-20 gap-4 opacity-50">
                        <LoadingSpinner />
                        <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Consultando Banco Mocha...</p>
                    </div>
                ) : !query ? (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Buscas recentes</h3>
                            <button onClick={() => setHistory([])} className="p-1"><TrashIcon className="w-4 h-4 text-gray-700" /></button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {history.map(h => (
                                <button 
                                    key={h} 
                                    onClick={() => setQuery(h)}
                                    className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs font-bold text-gray-300 hover:text-white transition-all"
                                >
                                    {h}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-4">
                        {userResults.length > 0 ? (
                            <div className="space-y-2">
                                {userResults.map(user => (
                                    <div 
                                        key={user.id} 
                                        onClick={() => handleUserClick(user)}
                                        className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 active:bg-white/10 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img src={user.avatarUrl} className="w-12 h-12 rounded-full object-cover border border-white/10" alt="" />
                                                <div className="absolute -bottom-1 -right-1">
                                                    <LevelBadge level={user.level} />
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-white font-black text-sm">{user.name}</span>
                                                <span className="text-gray-500 text-[10px] font-bold">ID: {user.identification}</span>
                                            </div>
                                        </div>
                                        <button className="bg-purple-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase text-white shadow-lg shadow-purple-900/20">Perfil</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center mt-20 opacity-40">
                                <SearchIcon className="w-12 h-12 mb-4" />
                                <p className="text-sm font-bold uppercase tracking-widest">Nenhum resultado real</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchScreen;