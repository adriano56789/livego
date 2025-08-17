
import React, { useState, useEffect, useCallback } from 'react';
import type { User, GeneralRankingStreamer, GeneralRankingUser, Stream, PkBattle } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import { useApiViewer } from './ApiContext';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import PodiumCrownIcon from './icons/PodiumCrownIcon';
import UserProfileModal from './UserProfileModal';

interface RankingScreenProps {
  currentUser: User;
  onExit: () => void;
  onUpdateUser: (user: User) => void;
  onNavigateToChat: (userId: number) => void;
  onViewProtectors: (userId: number) => void;
  onViewStream: (stream: Stream | PkBattle) => void;
}

const formatScore = (num: number) => num.toLocaleString('pt-BR');

const PodiumItem: React.FC<{ user: GeneralRankingStreamer | GeneralRankingUser; position: 1 | 2 | 3; onUserClick: (userId: number) => void; type: 'streamers' | 'users' }> = ({ user, position, onUserClick, type }) => {
    const isFirst = position === 1;
    const size = isFirst ? 'w-24 h-24' : 'w-20 h-20';
    const border = isFirst ? 'border-4 border-yellow-400' : 'border-2 border-gray-400';
    const nameColor = isFirst ? 'text-yellow-300' : 'text-gray-200';
    const order = isFirst ? 'order-2' : position === 2 ? 'order-1' : 'order-3';
    const value = type === 'streamers' ? formatScore((user as GeneralRankingStreamer).followers) : formatScore((user as GeneralRankingUser).xp);
    const label = type === 'streamers' ? 'Seguidores' : 'XP';

    return (
        <button onClick={() => onUserClick(user.userId)} className={`flex flex-col items-center text-center ${order} ${isFirst ? 'self-end' : 'self-end mb-2'}`}>
            <div className="relative">
                {isFirst && <PodiumCrownIcon className="w-12 h-12 absolute -top-8 left-1/2 -translate-x-1/2 z-10" />}
                <img src={user.avatarUrl} alt={user.username} className={`${size} rounded-full object-cover ${border}`} />
            </div>
            <p className={`font-bold mt-2 truncate max-w-full ${nameColor}`}>{user.username}</p>
            <p className="text-sm text-white font-semibold">{value} <span className="text-xs text-gray-400">{label}</span></p>
        </button>
    );
};

const UserRow: React.FC<{ user: GeneralRankingStreamer | GeneralRankingUser; onUserClick: (userId: number) => void; type: 'streamers' | 'users' }> = ({ user, onUserClick, type }) => {
    const value = type === 'streamers' ? formatScore((user as GeneralRankingStreamer).followers) : formatScore((user as GeneralRankingUser).xp);
    return (
        <button onClick={() => onUserClick(user.userId)} className="flex items-center w-full px-2 py-2 hover:bg-white/10 rounded-lg transition-colors">
            <div className="w-10 text-center text-gray-300 font-bold">{user.rank}</div>
            <img src={user.avatarUrl} alt={user.username} className="w-12 h-12 rounded-full object-cover mx-3" />
            <div className="flex-grow text-left">
                <p className="font-semibold text-white">{user.username}</p>
                <p className="text-xs text-gray-400">Nível {user.level}</p>
            </div>
            <p className="font-bold text-white">{value}</p>
        </button>
    );
};


const RankingScreen: React.FC<RankingScreenProps> = ({ currentUser, onExit, onUpdateUser, onNavigateToChat, onViewProtectors, onViewStream }) => {
    const [activeTab, setActiveTab] = useState<'streamers' | 'users'>('streamers');
    const [streamerRanking, setStreamerRanking] = useState<GeneralRankingStreamer[]>([]);
    const [userRanking, setUserRanking] = useState<GeneralRankingUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showApiResponse } = useApiViewer();
    const [viewingUserId, setViewingUserId] = useState<number | null>(null);

    useEffect(() => {
        const fetchRanking = async () => {
            setIsLoading(true);
            try {
                if (activeTab === 'streamers') {
                    const data = await liveStreamService.getStreamerRanking();
                    showApiResponse('GET /api/ranking/streamers', data);
                    setStreamerRanking(data);
                } else {
                    const data = await liveStreamService.getUserRanking();
                    showApiResponse('GET /api/ranking/users', data);
                    setUserRanking(data);
                }
            } catch (error) {
                console.error(`Failed to fetch ${activeTab} ranking`, error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRanking();
    }, [activeTab, showApiResponse]);
    
    const handleUserClick = (userId: number) => {
        setViewingUserId(userId);
    };

    const renderList = () => {
        const list = activeTab === 'streamers' ? streamerRanking : userRanking;
        if (list.length === 0) return <div className="flex-grow flex items-center justify-center text-gray-400">Nenhum ranking disponível.</div>;
        
        const top3 = list.filter(u => u.rank <= 3).sort((a,b) => a.rank - b.rank);
        const top1 = top3.find(u => u.rank === 1);
        const top2 = top3.find(u => u.rank === 2);
        const top3user = top3.find(u => u.rank === 3);
        const rest = list.filter(u => u.rank > 3);

        return (
            <>
                <div className="h-48 flex justify-around items-end px-4 shrink-0">
                    {top2 && <PodiumItem user={top2} position={2} onUserClick={handleUserClick} type={activeTab} />}
                    {top1 && <PodiumItem user={top1} position={1} onUserClick={handleUserClick} type={activeTab} />}
                    {top3user && <PodiumItem user={top3user} position={3} onUserClick={handleUserClick} type={activeTab} />}
                </div>
                <div className="flex-grow bg-black/20 rounded-t-2xl mt-4 p-2 space-y-1 overflow-y-auto scrollbar-hide">
                    {rest.map(user => <UserRow key={user.userId} user={user} onUserClick={handleUserClick} type={activeTab} />)}
                </div>
            </>
        );
    };

    return (
        <>
            <div className="h-screen w-full bg-gradient-to-b from-[#1E1B4B] to-[#141026] text-white flex flex-col font-sans">
                <header className="p-4 flex items-center justify-between shrink-0">
                    <button onClick={onExit} className="p-2 -m-2"><ArrowLeftIcon className="w-6 h-6" /></button>
                    <h1 className="font-bold text-lg">Central de Ranking</h1>
                    <div className="w-6 h-6"></div>
                </header>

                <main className="flex-grow p-4 flex flex-col overflow-hidden">
                    <div className="shrink-0 flex items-center justify-center p-1 bg-black/20 rounded-full my-2">
                        <button onClick={() => setActiveTab('streamers')} className={`w-1/2 py-2 rounded-full text-sm font-bold transition-colors ${activeTab === 'streamers' ? 'bg-gradient-to-r from-purple-600 to-indigo-500' : 'text-gray-400'}`}>
                            Ranking de Streamers
                        </button>
                        <button onClick={() => setActiveTab('users')} className={`w-1/2 py-2 rounded-full text-sm font-bold transition-colors ${activeTab === 'users' ? 'bg-gradient-to-r from-purple-600 to-indigo-500' : 'text-gray-400'}`}>
                            Ranking de Usuários
                        </button>
                    </div>

                    <div className="flex items-center text-sm text-gray-300 font-semibold py-2 px-2 mt-4">
                        <p className="w-10 text-center">Posição</p>
                        <p className="flex-1 ml-5">{activeTab === 'streamers' ? 'Streamer' : 'Usuário'}</p>
                        <p>{activeTab === 'streamers' ? 'Seguidores' : 'XP'}</p>
                    </div>

                    {isLoading ? (
                        <div className="flex-grow flex items-center justify-center"><div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div></div>
                    ) : (
                        renderList()
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

export default RankingScreen;