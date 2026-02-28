
import React, { useState, useEffect } from 'react';
import { CloseIcon, YellowDiamondIcon, CrownIcon, FemaleIcon, MaleIcon, RankIcon } from './icons';
import { RealisticTop1CrownIcon } from './icons/RealisticTop1CrownIcon';
import { RealisticRank2CrownIcon } from './icons/RealisticRank2CrownIcon';
import { RealisticRank3CrownIcon } from './icons/RealisticRank3CrownIcon';
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
        <div className={`flex items-center space-x-0.5 px-1.5 py-0.5 rounded-full border ${isMale ? 'bg-[#1e3a8a]/80 border-blue-500 text-blue-100' : 'bg-[#831843]/80 border-pink-500 text-pink-100'} shadow-sm`}>
            {isMale ? <MaleIcon className="h-2.5 w-2.5" /> : <FemaleIcon className="h-2.5 w-2.5" />}
            <span className="text-[10px] font-bold leading-none">{user.age}</span>
        </div>
    );
};

const LevelBadge: React.FC<{ user: RankedUser }> = ({ user }) => (
    <div className="flex items-center space-x-0.5 px-1.5 py-0.5 rounded-full bg-[#3b0764]/80 border border-purple-500 text-purple-100 shadow-sm">
        <RankIcon className="h-2.5 w-2.5" />
        <span className="text-[10px] font-bold leading-none">{user.level}</span>
    </div>
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

    // Rank 2 = Pink, Rank 3 = Blue, Rank 4+ = Purple
    const getCardStyle = (index: number) => {
        if (index === 0) return 'border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.15)] bg-gradient-to-r from-[#0f172a] to-[#831843]/20'; // Rank 2
        if (index === 1) return 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)] bg-gradient-to-r from-[#0f172a] to-[#1e3a8a]/20'; // Rank 3
        return 'border-purple-500/30 bg-[#161618]'; // Rank 4+
    };
    
    const getRankNumberStyle = (index: number) => {
         if (index === 0) return 'text-pink-400 text-2xl'; // Rank 2
         if (index === 1) return 'text-blue-400 text-2xl'; // Rank 3
         return 'text-white/70 text-lg';
    };

    return (
        <div className="absolute inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
            {/* Transparent Backdrop to close */}
            <div className="absolute inset-0 bg-transparent" />
            
            {/* Modal Content - Reduced height to 50% */}
            <div
                className="relative w-full max-w-md h-[50%] bg-[#0a0a0c]/95 backdrop-blur-xl rounded-t-[2rem] flex flex-col overflow-hidden shadow-2xl border-t border-white/10"
                onClick={e => e.stopPropagation()}
            >
                {/* Decorative background gradients */}
                <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-b from-[#1a103c]/80 via-[#0f0a20]/80 to-black/90 pointer-events-none" />
                
                {/* Header */}
                <header className="relative z-10 pt-4 px-4 pb-2 shrink-0">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-600/50 rounded-full"></div>
                    <button 
                        onClick={onClose} 
                        className="absolute right-4 top-4 p-1.5 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-white/70"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                    
                    <h2 className="text-lg font-bold text-white text-center w-full tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] mt-4">
                        Ranking de Contribuição
                    </h2>

                    {/* Navigation Tabs */}
                    <nav className="flex items-center justify-center space-x-6 mt-4 border-b border-white/5">
                        {(['Live', 'Diária', 'Semanal', 'Mensal'] as Period[]).map(tab => {
                            const isActive = activeTab === tab;
                            return (
                                <button 
                                    key={tab} 
                                    onClick={() => setActiveTab(tab)} 
                                    className={`pb-2 text-xs font-bold transition-all relative px-2 ${
                                        isActive 
                                            ? 'text-white' 
                                            : 'text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    {tab}
                                    {isActive && (
                                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-pink-500 to-purple-500 rounded-t-full shadow-[0_-2px_8px_rgba(236,72,153,0.5)]"></div>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </header>

                {/* Main Scrollable Area */}
                <main className="relative z-10 flex-grow overflow-y-auto no-scrollbar px-4 pb-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <LoadingSpinner />
                        </div>
                    ) : (
                    <div className="flex flex-col items-center pt-2">
                        
                        {/* --- TOP 1 USER --- */}
                        {topUser ? (
                            <div className="flex flex-col items-center mb-6 relative mt-12">
                                <div className="relative mb-2">
                                    {/* Real Gold Crown - Positioned ON HEAD */}
                                    <div className="absolute -top-[3.4rem] left-1/2 -translate-x-1/2 z-20 filter drop-shadow-2xl scale-125">
                                        <RealisticTop1CrownIcon className="w-20 h-20" />
                                    </div>
                                    
                                    {/* Avatar Ring */}
                                    <div className="w-20 h-20 rounded-full p-[2px] bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 shadow-[0_0_20px_rgba(234,179,8,0.3)] relative z-10">
                                        <div className="w-full h-full rounded-full border-[2px] border-[#0a0a0c] overflow-hidden bg-gray-800">
                                            <img 
                                                src={topUser.avatarUrl} 
                                                alt={topUser.name} 
                                                className="w-full h-full object-cover" 
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Rank 1 Badge */}
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[9px] font-black px-2 py-0.5 rounded-md shadow-md z-20 border border-white/20">
                                        TOP 1
                                    </div>
                                </div>

                                <h3 className="text-base font-bold text-white mt-1 mb-0.5 tracking-wide">{topUser.name}</h3>
                                
                                {/* Badges Row */}
                                <div className="flex items-center justify-center space-x-2 mb-1.5">
                                    <GenderAgeBadge user={topUser} />
                                    <LevelBadge user={topUser} />
                                </div>
                                
                                {/* Score */}
                                <div className="flex items-center space-x-1 text-yellow-400 bg-yellow-500/10 px-3 py-0.5 rounded-full border border-yellow-500/20">
                                    <span className="text-lg font-black italic tracking-tight drop-shadow-sm">
                                        {formatContribution(topUser.contribution)}
                                    </span>
                                    <YellowDiamondIcon className="w-3.5 h-3.5" />
                                </div>
                            </div>
                        ) : (
                             <div className="py-10 text-gray-500 font-medium text-center text-sm">
                                 Nenhum dado disponível.
                             </div>
                        )}
                        
                        {/* --- LIST (Rank 2+) --- */}
                        <div className="w-full space-y-2 pb-safe">
                            {otherUsers.map((user, index) => (
                                <div 
                                    key={user.id} 
                                    className={`flex items-center p-2 rounded-xl border ${getCardStyle(index)} relative overflow-visible group`}
                                >
                                    {/* Rank Number */}
                                    <div className={`w-8 text-center flex-shrink-0 font-black italic ${getRankNumberStyle(index)}`}>
                                        {index + 2}
                                    </div>

                                    {/* Avatar */}
                                    <div className="relative mr-3 flex-shrink-0">
                                        {/* Realistic Silver Crown for Rank 2 */}
                                        {index === 0 && (
                                            <div className="absolute -top-[2.2rem] left-1/2 -translate-x-1/2 z-20">
                                                <RealisticRank2CrownIcon className="w-14 h-14 filter drop-shadow-lg" />
                                            </div>
                                        )}
                                        {/* Realistic Bronze Crown for Rank 3 */}
                                        {index === 1 && (
                                            <div className="absolute -top-[2.2rem] left-1/2 -translate-x-1/2 z-20">
                                                <RealisticRank3CrownIcon className="w-14 h-14 filter drop-shadow-lg" />
                                            </div>
                                        )}

                                        <div className={`w-10 h-10 rounded-full p-[1.5px] ${index === 0 ? 'bg-pink-400' : index === 1 ? 'bg-blue-400' : 'bg-gray-600'}`}>
                                            <img 
                                                src={user.avatarUrl} 
                                                alt={user.name} 
                                                className="w-full h-full rounded-full object-cover border border-[#161618]" 
                                            />
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-grow min-w-0 flex flex-col justify-center">
                                        <div className="flex items-center space-x-2 mb-0.5">
                                            <p className="font-bold text-white truncate text-sm">{user.name}</p>
                                        </div>
                                        <div className="flex items-center space-x-1.5 scale-90 origin-left">
                                            <GenderAgeBadge user={user} />
                                            <LevelBadge user={user} />
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div className="flex items-center space-x-1 text-yellow-400 ml-2 flex-shrink-0 bg-black/30 px-2 py-0.5 rounded-lg">
                                        <span className="font-bold text-sm">
                                            {formatContribution(user.contribution)}
                                        </span>
                                        <YellowDiamondIcon className="w-3 h-3" />
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
