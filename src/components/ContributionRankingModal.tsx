
import React, { useState, useEffect } from 'react';
import { CloseIcon, YellowDiamondIcon, CrownIcon, FemaleIcon, MaleIcon, RankIcon } from './icons';
import { RankedUser, User } from '../types';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';

type Period = 'Live' | 'Diária' | 'Semanal' | 'Mensal';
type PeriodKey = 'daily' | 'weekly' | 'monthly';

const formatContribution = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.', ',') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
};

const GenderAgeBadge: React.FC<{ user: RankedUser }> = ({ user }) => {
    const isMale = user.gender === 'male';
    return (
        <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${isMale ? 'bg-blue-500' : 'bg-pink-500'} shadow-sm border border-white/20`}>
            {isMale ? <MaleIcon className="h-3 w-3" /> : <FemaleIcon className="h-3 w-3" />}
            <span>{user.age}</span>
        </span>
    );
};

const LevelBadge: React.FC<{ user: RankedUser }> = ({ user }) => (
    <span className="bg-purple-600 border border-purple-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 shadow-sm">
        <RankIcon className="h-3 w-3" />
        <span>{user.level}</span>
    </span>
);

interface ContributionRankingModalProps {
    onClose: () => void;
    liveRanking?: (User & { value: number })[];
}

const ContributionRankingModal: React.FC<ContributionRankingModalProps> = ({ onClose, liveRanking }) => {
    const [activeTab, setActiveTab] = useState<Period>('Live');
    const [data, setData] = useState<RankedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const periodMap: Record<Period, PeriodKey | 'live'> = {
            'Live': 'live',
            'Diária': 'daily',
            'Semanal': 'weekly',
            'Mensal': 'monthly',
        };
        
        const currentPeriod = periodMap[activeTab];

        if (currentPeriod === 'live') {
            setIsLoading(true);
            const mappedData = (liveRanking || [])
                .filter(u => u.value > 0)
                .map(u => ({
                    ...u,
                    contribution: u.value,
                    gender: u.gender || 'not_specified',
                    age: u.age || 0,
                } as RankedUser));
            setData(mappedData);
            setIsLoading(false);
        } else {
            setIsLoading(true);
            api.getRankingForPeriod(currentPeriod as PeriodKey)
                .then(rankingData => setData(rankingData || []))
                .catch(console.error)
                .finally(() => setIsLoading(false));
        }
    }, [activeTab, liveRanking]);

    const topUser = data[0];
    const otherUsers = data.slice(1);

    const getCardStyle = (index: number) => {
        // Index 0 is Rank 2, Index 1 is Rank 3, etc.
        if (index === 0) return 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]';
        if (index === 1) return 'border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.4)]';
        return 'border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]';
    };

    return (
        <div className="absolute inset-0 z-50 flex items-end justify-center" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            
            {/* Main Modal Container */}
            <div
                className="relative w-full max-w-md h-[90%] rounded-t-3xl flex flex-col overflow-hidden bg-[#090515] border-t border-white/10"
                onClick={e => e.stopPropagation()}
            >
                {/* Decorative Background (Neon Lines) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-[#1a103c] via-[#0d0a20] to-transparent opacity-80"></div>
                    {/* Left Diagonal Neon */}
                    <div className="absolute top-[50px] -left-[50px] w-[200px] h-[400px] border-r-2 border-pink-500/20 transform skew-x-[30deg] blur-[2px]"></div>
                    <div className="absolute top-[50px] -left-[30px] w-[200px] h-[400px] border-r border-pink-500/10 transform skew-x-[30deg] blur-[1px]"></div>
                    {/* Right Diagonal Neon */}
                    <div className="absolute top-[50px] -right-[50px] w-[200px] h-[400px] border-l-2 border-yellow-500/20 transform -skew-x-[30deg] blur-[2px]"></div>
                    <div className="absolute top-[50px] -right-[30px] w-[200px] h-[400px] border-l border-yellow-500/10 transform -skew-x-[30deg] blur-[1px]"></div>
                </div>

                {/* Header */}
                <header className="relative z-10 pt-6 px-4 pb-2">
                    <button 
                        onClick={onClose} 
                        className="absolute left-4 top-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <CloseIcon className="w-5 h-5 text-white" />
                    </button>
                    
                    <h2 className="text-xl font-bold text-white text-center w-full drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]">
                        Ranking de Contribuição
                    </h2>

                    {/* Tabs */}
                    <nav className="flex items-center justify-center space-x-6 mt-6">
                        {(['Live', 'Diária', 'Semanal', 'Mensal'] as Period[]).map(tab => {
                            const isActive = activeTab === tab;
                            return (
                                <button 
                                    key={tab} 
                                    onClick={() => setActiveTab(tab)} 
                                    className={`pb-2 text-sm font-bold transition-all relative ${
                                        isActive 
                                            ? 'text-white' 
                                            : 'text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    {tab}
                                    {isActive && (
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-pink-500 rounded-full shadow-[0_0_8px_#ec4899]"></div>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </header>

                <main className="relative z-10 flex-grow overflow-y-auto no-scrollbar px-4 pb-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <LoadingSpinner />
                        </div>
                    ) : (
                    <div className="flex flex-col items-center pt-2">
                        {/* Top 1 User - Featured */}
                        {topUser ? (
                            <div className="flex flex-col items-center mb-8 mt-2 scale-110">
                                <div className="relative mb-3">
                                    {/* Golden Crown */}
                                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-20">
                                        <CrownIcon className="w-14 h-14 text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] filter brightness-110" />
                                    </div>
                                    
                                    {/* Avatar Glow Ring */}
                                    <div className="absolute inset-0 rounded-full border-[3px] border-yellow-400 blur-[3px]"></div>
                                    <div className="absolute inset-0 rounded-full shadow-[0_0_40px_rgba(250,204,21,0.5)]"></div>

                                    {/* Avatar */}
                                    <div className="relative w-28 h-28 rounded-full p-[3px] bg-gradient-to-b from-yellow-300 to-yellow-600">
                                        <img 
                                            src={topUser.avatarUrl} 
                                            alt={topUser.name} 
                                            className="w-full h-full rounded-full object-cover border-2 border-black bg-gray-800" 
                                        />
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mt-1 drop-shadow-md tracking-wide">{topUser.name}</h3>
                                
                                <div className="flex items-center space-x-2 my-2">
                                    <GenderAgeBadge user={topUser} />
                                    <LevelBadge user={topUser} />
                                </div>
                                
                                <div className="flex items-center space-x-1 text-yellow-400 mt-0.5">
                                    <span className="text-3xl font-black drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]">
                                        {formatContribution(topUser.contribution)}
                                    </span>
                                    <YellowDiamondIcon className="w-6 h-6 filter drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" />
                                </div>
                            </div>
                        ) : (
                             <div className="py-10 text-gray-500 font-semibold">Nenhum dado disponível.</div>
                        )}
                        
                        {/* List - Rank 2, 3, 4... */}
                        <div className="w-full space-y-3 pb-8">
                            {otherUsers.map((user, index) => (
                                <div 
                                    key={user.id} 
                                    className={`flex items-center p-3 rounded-2xl border bg-[#131128]/80 backdrop-blur-md relative overflow-hidden ${getCardStyle(index)}`}
                                >
                                    {/* Rank Number */}
                                    <div className="w-10 text-center flex-shrink-0">
                                        <span className="text-2xl font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                                            {index + 2}
                                        </span>
                                    </div>

                                    {/* Avatar */}
                                    <div className="relative mr-3 flex-shrink-0">
                                        <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 to-purple-600">
                                            <img 
                                                src={user.avatarUrl} 
                                                alt={user.name} 
                                                className="w-full h-full rounded-full object-cover border border-black bg-gray-800" 
                                            />
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-grow min-w-0 flex flex-col justify-center">
                                        <div className="flex items-center space-x-1.5 mb-1">
                                            <p className="font-bold text-white truncate text-base">{user.name}</p>
                                            {/* Small crown icons for Ranks 2 & 3 */}
                                            {index === 0 && <CrownIcon className="w-4 h-4 text-gray-300" />} 
                                            {index === 1 && <CrownIcon className="w-4 h-4 text-yellow-700" />}
                                        </div>
                                        <div className="flex items-center space-x-1.5">
                                            <GenderAgeBadge user={user} />
                                            <LevelBadge user={user} />
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div className="flex items-center space-x-1 text-yellow-400 ml-2 flex-shrink-0">
                                        <span className="font-bold text-xl drop-shadow-[0_0_5px_rgba(250,204,21,0.4)]">
                                            {formatContribution(user.contribution)}
                                        </span>
                                        <YellowDiamondIcon className="w-4 h-4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ContributionRankingModal;
