import React, { useState, useEffect, useMemo } from 'react';
import type { User } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import SearchIcon from './icons/SearchIcon';
import VideoIcon from './icons/VideoIcon';
import MaleIcon from './icons/MaleIcon';
import FemaleIcon from './icons/FemaleIcon';
import BrazilFlagIcon from './icons/BrazilFlagIcon';
import UsaFlagIcon from './icons/UsaFlagIcon';
import SwedenFlagIcon from './icons/SwedenFlagIcon';

interface SelectOpponentModalProps {
  currentUserId: number;
  onClose: () => void;
  onInvite: (invitee: User) => void;
}

const FlagIcon: React.FC<{ countryCode?: User['country'] | null }> = ({ countryCode }) => {
    const className = "w-6 h-6 absolute -bottom-1 -right-1";
    switch(countryCode) {
        case 'BR': return <BrazilFlagIcon className={className} />;
        case 'US': return <UsaFlagIcon className={className} />;
        // Sweden ('SE') is not in the User type, but the component is here if the type is extended
        // case 'SE': return <SwedenFlagIcon className={className} />;
        default: return null;
    }
}


const OpponentRow: React.FC<{ user: User; onInvite: (user: User) => void }> = ({ user, onInvite }) => {
    return (
        <div className="flex items-center gap-3 py-2">
            <div className="relative shrink-0">
                <img src={user.avatar_url} alt={user.nickname || user.name} className="w-14 h-14 rounded-full object-cover" />
                <FlagIcon countryCode={user.country} />
            </div>
            <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-black truncate">{user.nickname || user.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                    {user.age && user.gender && (
                        <div className={`flex items-center gap-1 text-white font-bold text-xs px-2 py-0.5 rounded-md ${user.gender === 'male' ? 'bg-sky-500' : 'bg-pink-500'}`}>
                            {user.gender === 'male' ? <MaleIcon className="w-3 h-3" /> : <FemaleIcon className="w-3 h-3" />}
                            <span>{user.age}</span>
                        </div>
                    )}
                </div>
            </div>
            <button
                onClick={() => onInvite(user)}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg hover:scale-105 transition-transform"
            >
                <VideoIcon className="w-6 h-6 text-white" />
            </button>
        </div>
    );
};


const SelectOpponentModal: React.FC<SelectOpponentModalProps> = ({ currentUserId, onClose, onInvite }) => {
    const [opponents, setOpponents] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [query, setQuery] = useState('');

    useEffect(() => {
        const fetchOpponents = async () => {
            setIsLoading(true);
            try {
                const data = await liveStreamService.getInvitableOpponents(currentUserId);
                setOpponents(data);
            } catch (error) {
                console.error("Failed to fetch opponents:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOpponents();
    }, [currentUserId]);

    const filteredOpponents = useMemo(() => {
        if (!query.trim()) return opponents;
        const lowerQuery = query.toLowerCase();
        return opponents.filter(user =>
            (user.nickname || user.name).toLowerCase().includes(lowerQuery) ||
            String(user.id).includes(lowerQuery)
        );
    }, [opponents, query]);

    return (
        <div className="fixed inset-0 z-50 bg-transparent flex items-end animate-fade-in-fast" onClick={onClose}>
            <div
                className="bg-white w-full h-[75vh] max-h-[650px] rounded-t-2xl flex flex-col text-black animate-slide-up-fast"
                onClick={e => e.stopPropagation()}
            >
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-2 shrink-0"></div>
                <header className="p-4 flex flex-col items-center shrink-0">
                    <h2 className="text-lg font-semibold text-gray-700">{opponents.length} amigos pendentes para parear</h2>
                    <div className="relative w-full mt-3">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Pesquisar"
                            className="w-full bg-gray-100 h-12 rounded-full pl-11 pr-4 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                    </div>
                </header>
                <main className="flex-grow overflow-y-auto px-4 scrollbar-hide">
                    {isLoading ? (
                        <div className="text-center text-gray-500 pt-10">Carregando...</div>
                    ) : filteredOpponents.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {filteredOpponents.map(user => (
                                <OpponentRow key={user.id} user={user} onInvite={onInvite} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 pt-10">Nenhum amigo encontrado.</div>
                    )}
                </main>
            </div>
             <style>{`
                @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
                @keyframes slide-up-fast { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .animate-slide-up-fast { animation: slide-up-fast 0.25s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default SelectOpponentModal;