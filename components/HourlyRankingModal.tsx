



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

const HourlyCountdown: React.FC<{ endTime: string }> = ({ endTime }) => {
    const calculateTimeLeft = useCallback(() => {
        const difference = +new Date(endTime) - +new Date();
        let timeLeft = { h: 0, m: 0, s: 0 };

        if (difference > 0) {
            timeLeft = {
                h: Math.floor((difference / (1000 * 60 * 60)) % 24),
                m: Math.floor((difference / 1000 / 60) % 60),
                s: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    }, [endTime]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    const format = (t: number) => t.toString().padStart(2, '0');

    return (
        <span>Contagem regressiva: <span className="font-bold text-white">{`${format(timeLeft.h)}:${format(timeLeft.m)}:${format(timeLeft.s)}`}</span></span>
    );
};

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
    const borderSize = isFirst ? 'border-4' : 'border-2';
    const borderColor = position === 1 ? 'border-yellow-400' : position === 2 ? 'border-slate-300' : 'border-amber-500';

    return (
        <button onClick={() => onUserClick(user.userId)} className="flex flex-col items-center text-center w-1/3">
            <div className="relative">
                {isFirst && <PodiumCrownIcon className="w-10 h-10 mb-1 text-yellow-400" />}
                <img src={user.avatarUrl} alt={user.name} className={`${baseSize} rounded-full object-cover ${borderSize} ${borderColor}`} />
                <UserRankBadge rank={user.rank as number} />
            </div>
            <p className="font-bold text-white text-sm mt-2 truncate w-full">{user.name}</p>
            <UserBadges user={user} />
            <div className="flex items-center gap-1.5 mt-1 text-xs text-yellow-400 font-semibold">
                <DiamondIcon className="w-3.5 h-3.5" />
                <span>{user.score.toLocaleString()}</span>
            </div>
        </button>
    );
};

const UserBadges: React.FC<{ user: UniversalRankingUser }> = ({ user }) => (
    <div className="flex items-center justify-center gap-1.5 mt-1">
        {user.badges.map((badge, i) => {
            if (badge.type === 'flag') {
                return <span key={i} className="text-xl">{badge.value}</span>
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

const UserRow: React.FC<{ user: UniversalRankingUser, onUserClick: (userId: number) => void }> = ({ user, onUserClick }) => (
    <button onClick={() => onUserClick(user.userId)} className="flex items-center gap-4 p-2 rounded-lg w-full hover:bg-white/5">
        <span className="w-8 text-center font-bold text-gray-400 text-lg">{user.rank}</span>
        <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
        <div className="flex-grow text-left">
            <p className="font-semibold text-white truncate">{user.name}</p>
            <UserBadges user={user} />
        </div>
        <div className="flex items-center gap-1.5 text-yellow-400 font-semibold">
            <DiamondIcon className="w-4 h-4" />
            <span>{user.score.toLocaleString()}</span>
        </div>
    </button>
);


const HourlyRankingModal: React.FC<UniversalRankingScreenProps> = ({ liveId, onClose, onUserClick, currentUser, onUpdateUser, streamer, onNavigateToList, onRequirePurchase }) => {
    const [data, setData] = useState<UniversalRankingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<HourlySubTab>('brazil');
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const result = await liveStreamService.getHourlyRanking(liveId, activeTab);
                setData(result);
            } catch (error) {
                console.error("Failed to fetch hourly ranking:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [liveId, activeTab]);

    const allUsers = [...(data?.podium || []), ...(data?.list || [])];
    const top3 = allUsers.filter(u => (u.rank as number) <= 3).sort((a,b) => (a.rank as number) - (b.rank as number));
    const restOfList = allUsers.filter(u => (u.rank as number) > 3).sort((a,b) => (a.rank as number) - (b.rank as number));

    return (
        <>
            <div className="fixed inset-0 z-50 bg-transparent flex items-end" onClick={onClose}>
                <div className="bg-gradient-to-b from-slate-900 to-slate-800 w-full rounded-t-2xl flex flex-col text-white animate-slide-up-fast max-h-[85vh]" onClick={e => e.stopPropagation()}>
                    <header className="p-4 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <img src={streamer.avatarUrl} alt={streamer.name} className="w-10 h-10 rounded-full object-cover" />
                            <div>
                                <h2 className="font-bold text-base">Lista Horária</h2>
                                {data?.countdown && <p className="text-xs text-gray-400"><HourlyCountdown endTime={data.countdown} /></p>}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsHelpModalOpen(true)}><QuestionMarkIcon className="w-6 h-6 text-gray-400" /></button>
                            <button onClick={onClose}><CrossIcon className="w-6 h-6 text-gray-400" /></button>
                        </div>
                    </header>

                    <nav className="flex items-center justify-center gap-4 py-2 shrink-0">
                        <button onClick={() => setActiveTab('brazil')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${activeTab === 'brazil' ? 'bg-white/90 text-black' : 'text-gray-300'}`}>Brasil</button>
                        <button onClick={() => setActiveTab('global')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${activeTab === 'global' ? 'bg-white/90 text-black' : 'text-gray-300'}`}>Global</button>
                    </nav>

                    <main className="flex-grow overflow-y-auto px-4">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-full"><div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div></div>
                        ) : data ? (
                            <>
                                <div className="flex justify-around items-end h-48">
                                    {data.podium.map(user => (
                                        <PodiumItem key={user.userId} user={user} position={user.rank as 1 | 2 | 3} type='hourly' onUserClick={onUserClick} />
                                    ))}
                                </div>
                                <div className="space-y-1 mt-4">
                                    {data.list.map(user => <UserRow key={user.userId} user={user} onUserClick={onUserClick} />)}
                                </div>
                            </>
                        ) : (
                            <p className="text-center text-gray-500 pt-10">Não foi possível carregar o ranking.</p>
                        )}
                    </main>

                    <footer className="p-3 shrink-0 border-t border-white/10 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <PresentIcon className="w-6 h-6 text-orange-400" />
                            <p className="text-sm font-semibold">Envie presentes para subir no ranking!</p>
                        </div>
                        <button onClick={onNavigateToList} className="text-sm font-bold text-purple-400 hover:text-purple-300">
                            Lista Completa &gt;
                        </button>
                    </footer>
                </div>
            </div>
            {isHelpModalOpen && data?.podium[0] && (
                <HelpRankingModal 
                    currentUser={currentUser}
                    targetUser={data.podium[0]}
                    giftValue={data.footerButtons?.primary.value ? parseInt(data.footerButtons.primary.value) : 100}
                    secondaryText={data.footerButtons?.primary.text || ''}
                    onClose={() => setIsHelpModalOpen(false)}
                    onConfirm={onUpdateUser}
                    onRequirePurchase={onRequirePurchase}
                />
            )}
        </>
    );
};

export default HourlyRankingModal;