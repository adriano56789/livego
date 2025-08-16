import React, { useState, useEffect, useCallback } from 'react';
import type { UniversalRankingData, UniversalRankingUser, User, UserListRankingPeriod } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import PodiumCrownIcon from './icons/PodiumCrownIcon';
import DiamondIcon from './icons/DiamondIcon';
import PresentIcon from './icons/PresentIcon';
import QuestionMarkIcon from './icons/QuestionMarkIcon';
import MaleIcon from './icons/MaleIcon';
import FemaleIcon from './icons/FemaleIcon';
import ProfileBadge from './ProfileBadge';
import CrossIcon from './icons/CrossIcon';
import HelpRankingModal from './HelpRankingModal';

interface UniversalRankingScreenProps {
  liveId: number;
  onClose: () => void;
  onUserClick: (userId: number) => void;
  currentUser: User;
  onUpdateUser: (user: User) => void;
  streamer: { id: number; name: string; avatarUrl: string; };
  onNavigateToList: () => void;
  onRequirePurchase: () => void;
}

type MainTab = 'hourly' | 'users';
type HourlySubTab = 'brazil' | 'global';
type UserListSubTab = UserListRankingPeriod;

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

const PodiumItem: React.FC<{ user: UniversalRankingUser; position: 1 | 2 | 3; type: MainTab, onUserClick: (userId: number) => void }> = ({ user, position, type, onUserClick }) => {
    const isFirst = position === 1;
    const baseSize = isFirst ? 'w-24 h-24' : 'w-20 h-20';
    const podiumHeight = isFirst ? 'h-40' : 'h-32';
    const order = isFirst ? 'order-2' : position === 2 ? 'order-1' : 'order-3';
    const podiumBlockColor = 'from-slate-700/50 to-slate-800/50';

    return (
        <button onClick={() => onUserClick(user.userId as number)} className={`flex flex-col items-center justify-end w-1/3 ${order} ${isFirst ? 'mb-0' : 'mb-4'}`}>
            <div className="relative">
                {isFirst && <PodiumCrownIcon className="w-12 h-12 absolute -top-10 left-1/2 -translate-x-1/2" />}
                <img src={user.avatarUrl} alt={user.name} className={`${baseSize} rounded-full object-cover border-2 border-white/50`} />
                <UserRankBadge rank={user.rank as number} />
            </div>
            <p className="font-bold text-white mt-2 truncate w-full">{user.name}</p>
            
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

            <div className={`bg-gradient-to-b ${podiumBlockColor} w-full ${podiumHeight} rounded-t-lg flex items-center justify-center mt-2`}>
                <span className="text-5xl font-bold text-white/70 opacity-80">{position}</span>
            </div>
        </button>
    );
};

const LoadingPodiumItem: React.FC<{position: 1|2|3}> = ({position}) => {
    const isFirst = position === 1;
    const podiumHeight = isFirst ? 'h-40' : 'h-32';
    const order = isFirst ? 'order-2' : position === 2 ? 'order-1' : 'order-3';
    return (
         <div className={`flex flex-col items-center justify-end w-1/3 ${order} ${isFirst ? 'mb-0' : 'mb-4'}`}>
            <p className="text-gray-400 text-xs mb-2">Por favor espera e ver</p>
            <div className={`bg-gradient-to-b from-slate-700/50 to-slate-800/50 w-full ${podiumHeight} rounded-t-lg flex items-center justify-center mt-2`}>
                <span className="text-5xl font-bold text-white/70 opacity-80">{position}</span>
            </div>
        </div>
    )
}

const RankingListItem: React.FC<{ user: UniversalRankingUser; onUserClick: (userId: number) => void; }> = ({ user, onUserClick }) => {
    return (
        <button onClick={() => onUserClick(user.userId as number)} className="flex items-center justify-between p-2 w-full hover:bg-white/10 rounded-lg">
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
                        Receber:
                        <PresentIcon className="w-4 h-4 text-yellow-400" />
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
        </button>
    );
};


const HourlyRankingModal: React.FC<UniversalRankingScreenProps> = ({ liveId, onClose, onUserClick, currentUser, onUpdateUser, streamer, onNavigateToList, onRequirePurchase }) => {
    const [mainTab, setMainTab] = useState<MainTab>('hourly');
    const [hourlySubTab, setHourlySubTab] = useState<HourlySubTab>('brazil');
    const [userListSubTab, setUserListSubTab] = useState<UserListSubTab>('daily');
    const [data, setData] = useState<UniversalRankingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [helpModalInfo, setHelpModalInfo] = useState<{
        targetUser: UniversalRankingUser;
        giftValue: number;
        secondaryText: string;
    } | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            let result: UniversalRankingData;
            if (mainTab === 'hourly') {
                result = await liveStreamService.getHourlyRanking(liveId, hourlySubTab);
            } else {
                result = await liveStreamService.getUserListRanking(userListSubTab);
            }
            setData(result);
        } catch (error) {
            console.error("Failed to fetch ranking data:", error);
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [mainTab, hourlySubTab, userListSubTab, liveId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleHelpClick = (type: 'first_place' | 'get_on_list') => {
        if (!data || !currentUser || !streamer) return;

        const allRankedUsers = [...data.podium, ...data.list];
        let hostData = allRankedUsers.find(u => u.userId === streamer.id);

        if (!hostData) {
            hostData = {
                userId: streamer.id, name: streamer.name, avatarUrl: streamer.avatarUrl,
                rank: 'Não está na lista', score: 0, level: 0, gender: null, badges: [{ type: 'flag', value: '🇧🇷' }]
            };
        }
        
        if (type === 'first_place') {
            const giftValue = parseInt(data.footerButtons?.primary.value || '1060', 10);
            setHelpModalInfo({
                targetUser: hostData,
                giftValue: giftValue,
                secondaryText: "Ajude o anfitrião a ficar em primeiro lugar"
            });
        } else { // get_on_list
            const giftValue = parseInt(data.footerButtons?.secondary.value || '203', 10);
            setHelpModalInfo({
                targetUser: hostData,
                giftValue: giftValue,
                secondaryText: "Ajude o anfitrião a entrar na lista"
            });
        }
    };

    const hourlyTabs: { key: HourlySubTab, label: string }[] = [ { key: 'brazil', label: 'Brasil'}, { key: 'global', label: 'Global'} ];
    const userListTabs: { key: UserListSubTab, label: string }[] = [ { key: 'daily', label: 'Diário'}, { key: 'weekly', label: 'Semanal'}, { key: 'total', label: 'Classificação Total'} ];
    
    const podiumUsers = data?.podium.sort((a,b) => (a.rank as number) - (b.rank as number)) || [];
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
                        <button onClick={() => setMainTab('hourly')} className={`font-semibold pb-2 ${mainTab === 'hourly' ? 'text-white' : 'text-gray-400'}`}>
                           Classificação Horária
                        </button>
                         <button onClick={() => setMainTab('users')} className={`font-semibold pb-2 ${mainTab === 'users' ? 'text-white' : 'text-gray-400'}`}>
                           Lista de usuários
                        </button>
                        <div className={`absolute bottom-0 h-1 bg-white rounded-full transition-all duration-300 ${mainTab === 'hourly' ? 'w-[10.5rem] left-[calc(50%-12.5rem)]' : 'w-28 right-[calc(50%-10.5rem)]'}`} />
                    </nav>
                </header>
                
                 <div className="flex items-center justify-center gap-2 p-4 flex-shrink-0">
                    {mainTab === 'hourly' && hourlyTabs.map(tab => (
                        <button 
                            key={tab.key}
                            onClick={() => setHourlySubTab(tab.key)}
                            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${hourlySubTab === tab.key ? 'bg-white text-black' : 'bg-white/10 text-white'}`}
                        >
                            Lista horária de {tab.label}
                        </button>
                    ))}
                     {mainTab === 'users' && userListTabs.map(tab => (
                        <button 
                            key={tab.key}
                            onClick={() => setUserListSubTab(tab.key)}
                            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${userListSubTab === tab.key ? 'bg-white text-black' : 'bg-white/10 text-white'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                
                {isLoading ? (
                     <div className="flex-grow flex flex-col">
                        <div className="flex items-end justify-center px-4 mt-8 pt-4 flex-grow">
                            <LoadingPodiumItem position={2} />
                            <LoadingPodiumItem position={1} />
                            <LoadingPodiumItem position={3} />
                        </div>
                        <div className="flex-grow bg-black/20 rounded-t-2xl mt-4 flex items-center justify-center">
                            <p className="text-gray-400">Por favor espera e ver</p>
                        </div>
                    </div>
                ) : data ? (
                    <>
                        {mainTab === 'hourly' && (
                            <div className="px-4 py-2 flex justify-between items-center text-sm text-gray-200">
                                <span>Contagem regressiva: <span className="font-bold text-white">{data.countdown}</span></span>
                                <button onClick={onNavigateToList} className="flex items-center gap-1">A lista horária <span className="font-bold">&gt;</span></button>
                            </div>
                        )}
                        <div className="flex items-end justify-center px-4 mt-8 pt-4">
                            {secondPlace && <PodiumItem user={secondPlace} position={2} type={mainTab} onUserClick={onUserClick} />}
                            {firstPlace && <PodiumItem user={firstPlace} position={1} type={mainTab} onUserClick={onUserClick} />}
                            {thirdPlace && <PodiumItem user={thirdPlace} position={3} type={mainTab} onUserClick={onUserClick} />}
                        </div>
                        <div className="flex-grow bg-black/20 rounded-t-2xl mt-4 overflow-y-auto">
                            {data.list.map(user => <RankingListItem key={user.userId} user={user} onUserClick={onUserClick} />)}
                        </div>
                    </>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-gray-500">
                        <p>Nenhum ranking encontrado.</p>
                    </div>
                )}

                {mainTab === 'hourly' && data?.footerButtons && !isLoading && (
                    <footer className="p-3 grid grid-cols-2 gap-3 bg-black/40">
                         <button onClick={() => handleHelpClick('first_place')} className="bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-full p-2 text-center">
                            <p className="font-semibold text-sm">{data.footerButtons.primary.text}</p>
                            <p className="flex items-center justify-center gap-1 font-bold"><PresentIcon className="w-4 h-4"/>{data.footerButtons.primary.value}</p>
                         </button>
                         <button onClick={() => handleHelpClick('get_on_list')} className="bg-white/20 rounded-full p-2 text-center">
                            <p className="font-semibold text-sm">{data.footerButtons.secondary.text}</p>
                            <p className="flex items-center justify-center gap-1 font-bold"><PresentIcon className="w-4 h-4"/>{data.footerButtons.secondary.value}</p>
                         </button>
                    </footer>
                )}
            </main>
            {helpModalInfo && (
                <HelpRankingModal
                    currentUser={currentUser}
                    targetUser={helpModalInfo.targetUser}
                    giftValue={helpModalInfo.giftValue}
                    secondaryText={helpModalInfo.secondaryText}
                    onClose={() => setHelpModalInfo(null)}
                    onConfirm={(updatedUser) => {
                        onUpdateUser(updatedUser);
                        fetchData();
                    }}
                    onRequirePurchase={onRequirePurchase}
                />
            )}
        </div>
    );
};

export default HourlyRankingModal;