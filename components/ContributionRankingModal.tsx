
import React, { useState, useEffect, useCallback } from 'react';
import type { GeneralRankingStreamer, GeneralRankingUser } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import CrossIcon from './icons/CrossIcon';
import PodiumCrownIcon from './icons/PodiumCrownIcon';

interface ContributionRankingModalProps {
  streamerThumbnail: string;
  onClose: () => void;
  onUserClick: (userId: number) => void;
}

type Tab = 'streamers' | 'users';

const PodiumItem: React.FC<{ user: GeneralRankingStreamer | GeneralRankingUser; position: 1 | 2 | 3; onUserClick: (userId: number) => void; type: Tab }> = ({ user, position, onUserClick, type }) => {
    const isFirst = position === 1;
    const isSecond = position === 2;
    
    const containerClasses = `flex flex-col items-center text-center w-1/3 ${isFirst ? 'relative' : ''}`;
    const avatarSize = isFirst ? 'w-24 h-24' : 'w-20 h-20';
    const borderSize = isFirst ? 'border-4' : 'border-2';
    const borderColor = isFirst ? 'border-yellow-400' : isSecond ? 'border-slate-300' : 'border-amber-500';
    const value = user.score;
    const label = type === 'streamers' ? 'Recebidos' : 'Enviados';

    return (
        <button onClick={() => onUserClick(user.userId)} className={containerClasses}>
            <div className="relative">
                {isFirst && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10">
                        <PodiumCrownIcon className="w-12 h-12" />
                    </div>
                )}
                <img src={user.avatarUrl} alt={user.username} className={`${avatarSize} rounded-full object-cover ${borderSize} ${borderColor}`} />
            </div>
            <p className="font-bold text-white text-base mt-2 truncate max-w-full">{user.username}</p>
            <p className="text-sm text-gray-300">Nível {user.level}</p>
            <p className="text-yellow-400 font-semibold mt-1">{value || 0} {label}</p>
        </button>
    );
};

const UserRankItem: React.FC<{ user: GeneralRankingStreamer | GeneralRankingUser; onUserClick: (userId: number) => void; type: Tab }> = ({ user, onUserClick, type }) => {
    const value = user.score;

    return (
        <button onClick={() => onUserClick(user.userId)} className="flex items-center gap-4 p-2 rounded-lg w-full hover:bg-white/5">
            <span className="w-8 text-center font-bold text-gray-400 text-lg">{user.rank}</span>
            <img src={user.avatarUrl} alt={user.username} className="w-12 h-12 rounded-full object-cover" />
            <div className="flex-grow text-left">
                <p className="font-semibold text-white truncate">{user.username}</p>
                <p className="text-xs text-gray-400">Nível {user.level}</p>
            </div>
            <p className="font-bold text-yellow-400">{value || 0}</p>
        </button>
    );
};

const ContributionRankingModal: React.FC<ContributionRankingModalProps> = ({ streamerThumbnail, onClose, onUserClick }) => {
    const [activeTab, setActiveTab] = useState<Tab>('streamers');
    const [streamerRanking, setStreamerRanking] = useState<GeneralRankingStreamer[]>([]);
    const [userRanking, setUserRanking] = useState<GeneralRankingUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRanking = useCallback(async (tab: Tab) => {
        setIsLoading(true);
        try {
            if (tab === 'streamers') {
                const data = await liveStreamService.getStreamerRanking('daily');
                setStreamerRanking(data);
            } else {
                const data = await liveStreamService.getUserRanking('daily');
                setUserRanking(data);
            }
        } catch (error) {
            console.error(`Failed to fetch ${tab} ranking:`, error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRanking(activeTab);
    }, [activeTab, fetchRanking]);
    
    const ranking = activeTab === 'streamers' ? streamerRanking : userRanking;
    const top1 = ranking.find(u => u.rank === 1);
    const top2 = ranking.find(u => u.rank === 2);
    const top3 = ranking.find(u => u.rank === 3);
    const restOfRanking = ranking.filter(u => u.rank > 3);
    const TABS: { key: Tab, label: string }[] = [{key: 'streamers', label: 'Streamers'}, {key: 'users', label: 'Usuários'}];

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col font-sans animate-fade-in">
            <img src={streamerThumbnail} alt="Stream background" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-lg"/>
            <div className="absolute inset-0 bg-gradient-to-b from-purple-800/80 via-indigo-900/90 to-black/95"></div>
            
            <div className="relative z-10 flex flex-col h-full">
                <header className="p-4 flex items-center justify-between shrink-0">
                    <div className="w-8"></div>
                    <h2 className="text-lg font-bold text-white">Ranking Global</h2>
                    <button onClick={onClose} className="p-2 -m-2">
                        <CrossIcon className="w-6 h-6 text-gray-200" />
                    </button>
                </header>
                
                <main className="flex-grow overflow-y-auto px-4 flex flex-col">
                     <nav className="flex items-center justify-center gap-6 py-2 shrink-0">
                        {TABS.map(tab => (
                             <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-2 py-1.5 text-base font-semibold transition-colors relative ${
                                    activeTab === tab.key ? 'text-white' : 'text-indigo-200/70'
                                }`}
                            >
                                {tab.label}
                                {activeTab === tab.key && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-white rounded-full"></div>}
                            </button>
                        ))}
                    </nav>

                    {isLoading ? (
                        <div className="flex justify-center items-center flex-grow">
                           <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                       </div>
                    ) : ranking.length > 0 ? (
                        <>
                            <div className="relative h-60 mt-4 flex justify-around items-end">
                               {top2 && <PodiumItem user={top2} position={2} onUserClick={onUserClick} type={activeTab} />}
                               {top1 && <PodiumItem user={top1} position={1} onUserClick={onUserClick} type={activeTab} />}
                               {top3 && <PodiumItem user={top3} position={3} onUserClick={onUserClick} type={activeTab} />}
                            </div>

                            <div className="flex-grow bg-[#18100A]/70 rounded-t-2xl mt-4 p-2 space-y-1">
                                {restOfRanking.map(user => (
                                    <UserRankItem key={user.userId} user={user} onUserClick={onUserClick} type={activeTab} />
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex justify-center items-center flex-grow">
                            <p className="text-indigo-200">Nenhum ranking encontrado.</p>
                        </div>
                    )}
                </main>
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
             `}</style>
        </div>
    );
};

export default ContributionRankingModal;