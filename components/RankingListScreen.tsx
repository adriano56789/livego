import React, { useState, useEffect } from 'react';
import type { User, UniversalRankingData, UniversalRankingUser } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import QuestionMarkIcon from './icons/QuestionMarkIcon';
import CoinIcon from './icons/CoinIcon';
import ProfileBadge from './ProfileBadge';
import PodiumCrownIcon from './icons/PodiumCrownIcon';
import MaleIcon from './icons/MaleIcon';
import FemaleIcon from './icons/FemaleIcon';

interface RankingListScreenProps {
  liveId: number;
  currentUser: User;
  onExit: () => void;
  onUserClick: (userId: number) => void;
}

type Tab = 'brazil' | 'global';

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${isActive ? 'bg-white text-black' : 'bg-white/10 text-white'}`}
    >
        {label}
    </button>
);

const UserBadges: React.FC<{ user: UniversalRankingUser }> = ({ user }) => (
    <div className="flex items-center gap-1.5 mt-1">
        {user.badges.map((badge, i) => {
            if (badge.type === 'flag') {
                return <span key={i} className="text-lg">{badge.value}</span>
            }
            if (badge.type === 'v_badge') {
                return <span key={i} className="bg-purple-600 text-white w-4 h-4 text-xs font-bold rounded-full flex items-center justify-center border border-white/50">{badge.value}</span>
            }
            if (badge.type === 'level') {
                return <ProfileBadge key={i} badge={{ text: String(badge.value), type: 'level' }} />
            }
            if (badge.type === 'gender' && user.gender) {
                return (
                    <span key={i} className={`flex items-center justify-center p-1 rounded-md text-white ${user.gender === 'male' ? 'bg-sky-500' : 'bg-pink-500'}`}>
                        {user.gender === 'male' ? <MaleIcon className="w-3 h-3"/> : <FemaleIcon className="w-3 h-3"/>}
                    </span>
                );
            }
            return null;
        })}
    </div>
);


const UserRow: React.FC<{ user: UniversalRankingUser; isCurrentUser?: boolean; onUserClick: (userId: number) => void; }> = ({ user, isCurrentUser, onUserClick }) => {
    let rankColor = 'text-gray-400';
    if (user.rank === 1) rankColor = 'text-yellow-400';
    else if (user.rank === 2) rankColor = 'text-slate-300';
    else if (user.rank === 3) rankColor = 'text-amber-500';

    return (
        <button
            onClick={() => onUserClick(user.userId as number)}
            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${isCurrentUser ? 'bg-purple-500/30' : 'hover:bg-white/10'}`}
        >
            <span className={`w-8 text-center font-bold text-lg shrink-0 ${rankColor}`}>
                {user.rank === 1 ? <PodiumCrownIcon className="w-6 h-6 mx-auto text-yellow-400"/> : user.rank}
            </span>
            <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
            <div className="flex-grow text-left overflow-hidden">
                <p className="font-semibold text-white truncate">{user.name}</p>
                 <UserBadges user={user} />
            </div>
            <div className="flex items-center gap-1.5 text-yellow-400 font-semibold text-sm shrink-0">
                <CoinIcon className="w-4 h-4" />
                <span>{user.score}</span>
            </div>
        </button>
    );
};

const RankingListScreen: React.FC<RankingListScreenProps> = ({ liveId, currentUser, onExit, onUserClick }) => {
  const [activeTab, setActiveTab] = useState<Tab>('brazil');
  const [data, setData] = useState<UniversalRankingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await liveStreamService.getHourlyRanking(liveId, activeTab);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch ranking list:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab, liveId]);
  
  const allUsers = [...(data?.podium || []), ...(data?.list || [])].sort((a,b) => (a.rank as number) - (b.rank as number));

  return (
    <div className="fixed inset-0 z-40 bg-black flex flex-col font-sans animate-fade-in-fast text-white">
      <div className="absolute inset-0 bg-gradient-to-b from-[#4c1d95] via-[#1e1b4b] to-black opacity-80"></div>
      
      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        <header className="flex-shrink-0 p-4 flex items-center justify-between">
          <button onClick={onExit} className="p-2 -m-2"><ArrowLeftIcon className="w-6 h-6" /></button>
          <h1 className="font-bold text-lg">Lista Horária</h1>
          <button className="p-2 -m-2"><QuestionMarkIcon className="w-6 h-6" /></button>
        </header>

        <div className="flex items-center justify-center gap-2 p-2 flex-shrink-0">
            <TabButton label="Lista horária de Brasil" isActive={activeTab === 'brazil'} onClick={() => setActiveTab('brazil')} />
            <TabButton label="Lista horária global" isActive={activeTab === 'global'} onClick={() => setActiveTab('global')} />
        </div>

        <main className="flex-grow overflow-y-auto px-2 py-4 scrollbar-hide">
            {isLoading ? (
                <div className="flex justify-center items-center h-full">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : allUsers.length > 0 ? (
                <div className="space-y-1">
                    {allUsers.map(user => <UserRow key={user.userId} user={user} onUserClick={onUserClick} />)}
                </div>
            ) : (
                <p className="text-center text-gray-400 pt-20">Nenhum ranking encontrado.</p>
            )}
        </main>

        {data?.currentUserRanking && (
            <footer className="shrink-0 p-2 border-t border-white/10 bg-black/20 backdrop-blur-sm">
                <UserRow user={data.currentUserRanking} isCurrentUser onUserClick={onUserClick} />
            </footer>
        )}
      </div>
       <style>{`
        @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default RankingListScreen;