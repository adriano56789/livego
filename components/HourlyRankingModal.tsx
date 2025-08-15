
import React, { useState, useEffect, useCallback } from 'react';
import type { UniversalRankingData, UniversalRankingUser } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import PodiumCrownIcon from './icons/PodiumCrownIcon';
import DiamondIcon from './icons/DiamondIcon';
import PresentIcon from './icons/PresentIcon';
import QuestionMarkIcon from './icons/QuestionMarkIcon';
import MaleIcon from './icons/MaleIcon';
import FemaleIcon from './icons/FemaleIcon';
import ProfileBadge from './ProfileBadge';
import CrossIcon from './icons/CrossIcon';

interface UniversalRankingScreenProps {
  onClose: () => void;
  onUserClick: (userId: number) => void;
}

type MainTab = 'hourly' | 'users';
type SubTab = 'hourly_venezuela' | 'hourly_global' | 'daily' | 'weekly' | 'total' | 'hourly_brazil';

const UserRankBadge: React.FC<{ rank: number }> = ({ rank }) => {
    let bgColor = 'bg-slate-500';
    if (rank === 1) bgColor = 'bg-yellow-500';
    if (rank === 2) bgColor = 'bg-slate-400';
    if (rank === 3) bgColor = 'bg-amber-600';

    return (
        <div className={`absolute -top-1 -right-1 w-5 h-5 ${bgColor} rounded-full flex items-center justify-center text-white font-bold text-xs border-2 border-slate-800`}>
            {rank}
        </div>
    );
};

const PodiumItem: React.FC<{ user: UniversalRankingUser; position: 1 | 2 | 3; type: MainTab }> = ({ user, position, type }) => {
    const isFirst = position === 1;
    const baseSize = isFirst ? 'w-24 h-24' : 'w-20 h-20';
    const podiumHeight = isFirst ? 'h-40' : 'h-32';
    const order = isFirst ? 'order-2' : position === 2 ? 'order-1' : 'order-3';
    const podiumBlockColor = 'from-slate-700/50 to-slate-800/50';

    return (
        <div className={`flex flex-col items-center justify-end w-1/3 ${order} ${isFirst ? 'mb-0' : 'mb-4'}`}>
            <div className="relative">
                {isFirst && <PodiumCrownIcon className="w-12 h-12 absolute -top-10 left-1/2 -translate-x-1/2" />}
                <img src={user.avatarUrl} alt={user.name} className={`${baseSize} rounded-full object-cover border-2 border-white/50`} />
                <UserRankBadge rank={user.rank} />
            </div>
            <p className="font-bold text-white mt-2 truncate w-full">{user.name}</p>
            
             {type === 'hourly' && (
                <div className="flex flex-col items-center gap-1 mt-1 text-xs">
                    <div className="flex items-center gap-1.5 h-5">
                        {user.badges.find(b => b.type === 'v_badge') && (
                            <span className="bg-purple-600 text-white w-4 h-4 text-xs font-bold rounded-full flex items-center justify-center border border-white/50">V</span>
                        )}
                        {user.badges.find(b => b.type === 'flag') && <span>{user.badges.find(b => b.type === 'flag')?.value}</span>}
                        {user.level && <ProfileBadge badge={{ type: 'level', text: String(user.level) }} />}
                        {user.gender && (
                            <span className={`flex items-center justify-center p-1 rounded-md ${user.gender === 'male' ? 'bg-[#007aff]' : 'bg-[#ff2d55]'}`}>
                                {user.gender === 'male' ? <MaleIcon className="w-3 h-3 text-white"/> : <FemaleIcon className="w-3 h-3 text-white"/>}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400 font-semibold text-sm mt-1">
                        <PresentIcon className="w-4 h-4" />
                        <span>{user.score}</span>
                    </div>
                </div>
            )}

            <div className={`bg-gradient-to-b ${podiumBlockColor} w-full ${podiumHeight} rounded-t-lg flex items-center justify-center mt-2`}>
                <span className="text-5xl font-bold text-white/70 opacity-80">{position}</span>
            </div>
        </div>
    );
};

const RankingListItem: React.FC<{ user: UniversalRankingUser; type: MainTab }> = ({ user, type }) => {
    const ScoreIcon = type === 'hourly' ? PresentIcon : DiamondIcon;
    const scoreLabel = type === 'hourly' ? 'Receber' : 'Enviar';

    return (
        <div className="flex items-center justify-between p-2 w-full">
            {/* Left group: rank, avatar, name/info */}
            <div className="flex items-center gap-3 overflow-hidden">
                <span className="w-8 text-center font-bold text-gray-400 text-lg shrink-0">{user.rank}</span>
                <div className="relative shrink-0">
                    <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                    {user.badges.find(b => b.type === 'v_badge') && (
                        <span className="absolute -top-1 -right-1 bg-purple-600 text-white w-5 h-5 text-xs font-bold rounded-full flex items-center justify-center border-2 border-slate-800">V</span>
                    )}
                </div>
                <div className="text-left overflow-hidden">
                    <p className="font-semibold text-white truncate flex items-center gap-1">
                        {user.name}
                        {user.badges.find(b => b.type === 'flag') && <span>{user.badges.find(b => b.type === 'flag')?.value}</span>}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-300 mt-1">
                        {scoreLabel}:
                        <ScoreIcon className="w-4 h-4 text-yellow-400" />
                        <span className="font-semibold">{user.score}</span>
                    </div>
                </div>
            </div>

            {/* Right-aligned level badge */}
            <div className="flex items-center gap-1 shrink-0">
                {user.level && <ProfileBadge badge={{ type: 'level', text: String(user.level) }} />}
                {user.gender && (
                     <span className={`flex items-center justify-center p-1 rounded-md ${user.gender === 'male' ? 'bg-[#007aff]' : 'bg-[#ff2d55]'}`}>
                        {user.gender === 'male' ? <MaleIcon className="w-3 h-3 text-white"/> : <FemaleIcon className="w-3 h-3 text-white"/>}
                    </span>
                )}
            </div>
        </div>
    );
};


const HourlyRankingModal: React.FC<UniversalRankingScreenProps> = ({ onClose, onUserClick }) => {
    const [mainTab, setMainTab] = useState<MainTab>('hourly');
    const [subTab, setSubTab] = useState<SubTab>('hourly_brazil');
    const [data, setData] = useState<UniversalRankingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async (tab: SubTab) => {
        setIsLoading(true);
        try {
            const result = await liveStreamService.getUniversalRanking(tab);
            setData(result);
        } catch (error) {
            console.error("Failed to fetch ranking data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(subTab);
    }, [subTab, fetchData]);

    const handleMainTabChange = (tab: MainTab) => {
        setMainTab(tab);
        if (tab === 'hourly') {
            setSubTab('hourly_brazil');
        } else {
            setSubTab('daily');
        }
    };
    
    const hourlyTabs: { key: SubTab, label: string }[] = [
        { key: 'hourly_brazil', label: 'Lista horária de Brasil'},
        { key: 'hourly_venezuela', label: 'Lista horária de Venezuela'}
    ];
    const userTabs: { key: SubTab, label: string }[] = [
        { key: 'daily', label: 'Diário' },
        { key: 'weekly', label: 'Semanal' },
        { key: 'total', label: 'Classificação Total' }
    ];
    const subTabs = mainTab === 'hourly' ? hourlyTabs : userTabs;
    const podiumUsers = data?.podium.sort((a,b) => a.rank - b.rank) || [];
    const firstPlace = podiumUsers.find(u => u.rank === 1);
    const secondPlace = podiumUsers.find(u => u.rank === 2);
    const thirdPlace = podiumUsers.find(u => u.rank === 3);

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col font-sans animate-fade-in-fast text-white">
            <div className="absolute inset-0 bg-gradient-to-b from-[#1C1F24] to-black"></div>
            
            <main className="relative z-10 flex flex-col h-full overflow-hidden">
                <header className="flex-shrink-0 pt-6 relative">
                     <button onClick={onClose} className="absolute top-4 right-4 p-2 z-20 bg-black/20 rounded-full hover:bg-white/20 transition-colors" aria-label="Fechar">
                        <CrossIcon className="w-6 h-6 text-gray-300" />
                     </button>
                     <nav className="flex items-center justify-center gap-8 relative px-4">
                        <button onClick={() => handleMainTabChange('hourly')} className={`font-semibold pb-2 ${mainTab === 'hourly' ? 'text-white' : 'text-gray-400'}`}>
                           Classificação Horária
                        </button>
                         <button onClick={() => handleMainTabChange('users')} className={`font-semibold pb-2 ${mainTab === 'users' ? 'text-white' : 'text-gray-400'}`}>
                           Lista de usuários
                        </button>
                        <div className={`absolute bottom-0 h-1 bg-white rounded-full transition-all duration-300 ${mainTab === 'hourly' ? 'w-32 left-[calc(50%-10rem)]' : 'w-28 left-[calc(50%+2.25rem)]'}`} />
                    </nav>
                </header>
                
                 <div className="flex items-center justify-center gap-2 p-4 flex-shrink-0">
                    {subTabs.map(tab => (
                        <button 
                            key={tab.key}
                            onClick={() => setSubTab(tab.key)}
                            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${subTab === tab.key ? 'bg-white text-black' : 'bg-white/10 text-white'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                
                {isLoading ? (
                     <div className="flex-grow flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {mainTab === 'hourly' && data && (
                            <div className="px-4 py-2 flex justify-between items-center text-sm text-gray-200">
                                <span>Contagem regressiva: <span className="font-bold text-white">{data.countdown}</span></span>
                                <button className="flex items-center gap-1">A lista horária <span className="font-bold">&gt;</span></button>
                            </div>
                        )}
                        <div className="flex items-end justify-center px-4 mt-8 pt-4">
                            {secondPlace && <PodiumItem user={secondPlace} position={2} type={mainTab} />}
                            {firstPlace && <PodiumItem user={firstPlace} position={1} type={mainTab} />}
                            {thirdPlace && <PodiumItem user={thirdPlace} position={3} type={mainTab} />}
                        </div>
                        <div className="flex-grow bg-black/20 rounded-t-2xl mt-4 overflow-y-auto">
                            {data?.list.map(user => <RankingListItem key={user.userId} user={user} type={mainTab} />)}
                        </div>
                    </>
                )}

                {mainTab === 'hourly' && data?.footerButtons && !isLoading && (
                    <footer className="p-3 grid grid-cols-2 gap-3 bg-black/40">
                         <button className="bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-full p-2 text-center">
                            <p className="font-semibold text-sm">{data.footerButtons.primary.text}</p>
                            <p className="flex items-center justify-center gap-1 font-bold"><PresentIcon className="w-4 h-4"/>{data.footerButtons.primary.value}</p>
                         </button>
                         <button className="bg-white/20 rounded-full p-2 text-center">
                            <p className="font-semibold text-sm">{data.footerButtons.secondary.text}</p>
                            <p className="flex items-center justify-center gap-1 font-bold"><PresentIcon className="w-4 h-4"/>{data.footerButtons.secondary.value}</p>
                         </button>
                    </footer>
                )}
            </main>
        </div>
    );
};

export default HourlyRankingModal;
