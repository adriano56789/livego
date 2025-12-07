
import React, { useState, useEffect, useMemo } from 'react';
import { CloseIcon, YellowDiamondIcon, FemaleIcon, MaleIcon, RankIcon } from './icons';

const CrownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V17H19V19Z" />
  </svg>
);
import { RankedUser, User } from '../types';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';

type Period = 'Live' | 'Diária' | 'Semanal' | 'Mensal';

interface ContributionRankingModalProps {
    onClose: () => void;
    liveRanking?: (User & { value: number })[];
}

const formatScore = (score: number) => {
    if (score >= 1000000) return (score / 1000000).toFixed(1).replace('.', ',') + 'M';
    if (score >= 1000) return (score / 1000).toFixed(0) + 'K';
    return score.toLocaleString('pt-BR');
};

const RankingTab: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-3 text-base font-medium relative transition-colors ${
            isActive ? 'text-white font-bold' : 'text-gray-500 hover:text-gray-300'
        }`}
    >
        {label}
        {isActive && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#F5C965] rounded-full shadow-[0_0_8px_rgba(245,201,101,0.8)]" />
        )}
    </button>
);

const TopOne: React.FC<{ user: RankedUser }> = ({ user }) => {
    return (
        <div className="flex flex-col items-center pt-12 pb-6">
            <div className="relative">
                {/* Crown */}
                <div className="absolute -top-[2.5rem] left-1/2 -translate-x-1/2 z-20 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                    <CrownIcon className="w-14 h-14 text-[#FFD700]" />
                </div>
                
                {/* Avatar Container - Golden Ring */}
                <div className="w-28 h-28 rounded-full p-[3px] bg-gradient-to-b from-[#FFD700] via-[#FDB931] to-[#B8860B] shadow-lg relative z-10">
                     <div className="w-full h-full rounded-full border-[3px] border-[#1e1e24] bg-[#1e1e24] overflow-hidden">
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                    
                    {/* TOP 1 Badge */}
                    <div className="absolute -bottom-2 -right-1 transform -translate-x-1/2 z-30">
                        <div className="relative">
                            <div className="bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-[#78350f] text-[10px] font-black px-3 py-1 rounded-full border-2 border-[#FFF8E1] shadow-lg flex flex-col items-center leading-none">
                                <span className="text-[9px] font-extrabold tracking-wide">TOP</span>
                                <span className="text-sm font-bold">1</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Name */}
            <h3 className="text-[#FFD700] font-bold text-xl mt-4 mb-1 flex items-center justify-center">
                {user.name} <span className="text-white ml-1 text-base">✨</span>
            </h3>

            {/* Badges */}
            <div className="flex items-center justify-center space-x-2 mb-3">
                <div className={`flex items-center px-2 py-0.5 rounded-full space-x-1 ${user.gender === 'male' ? 'bg-blue-500' : 'bg-[#FF4D8D]'}`}>
                    {user.gender === 'male' ? <MaleIcon className="w-3 h-3 text-white" /> : <FemaleIcon className="w-3 h-3 text-white" />}
                    <span className="text-[10px] font-bold text-white">{user.age || 18}</span>
                </div>
                <div className="flex items-center px-2 py-0.5 rounded-full bg-[#8B5CF6] space-x-1">
                    <RankIcon className="w-3 h-3 text-white" />
                    <span className="text-[10px] font-bold text-white">{user.level}</span>
                </div>
            </div>

            {/* Score */}
            <div className="flex items-center text-[#FFD700] font-bold text-2xl">
                <span>{formatScore(user.contribution)}</span>
                <YellowDiamondIcon className="w-6 h-6 ml-1.5" />
            </div>
        </div>
    );
};

const RankingListItem: React.FC<{ user: RankedUser; rank: number }> = ({ user, rank }) => (
    <div className="flex items-center py-3.5 px-4 hover:bg-white/5 transition-colors border-b border-white/5">
        <div className="relative w-8 flex items-center justify-center">
            <span 
                className={`relative z-10 flex items-center justify-center w-7 h-7 rounded-full
                    ${rank === 1 ? 'bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#5E4200]' : 
                      rank === 2 ? 'bg-gradient-to-br from-[#C0C0C0] to-[#A0A0A0] text-[#3A3A3A]' : 
                      rank === 3 ? 'bg-gradient-to-br from-[#CD7F32] to-[#8B5A2B] text-[#3A2A16]' : 
                      'text-gray-400'}
                    font-bold text-lg shadow-md`}
            >
                {rank}
            </span>
        </div>
        <div className="relative mx-3">
             <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover bg-gray-700 border border-gray-600" />
        </div>
        <div className="flex-grow min-w-0 flex flex-col justify-center">
            <p className="text-white font-medium text-base truncate mb-0.5">{user.name}</p>
            <div className="flex items-center space-x-2">
                <div className={`flex items-center px-1.5 py-0.5 rounded-full space-x-1 ${user.gender === 'male' ? 'bg-blue-500' : 'bg-[#FF4D8D]'}`}>
                    {user.gender === 'male' ? <MaleIcon className="w-2.5 h-2.5 text-white" /> : <FemaleIcon className="w-2.5 h-2.5 text-white" />}
                    <span className="text-[9px] font-bold text-white">{user.age || 18}</span>
                </div>
                <div className="flex items-center px-1.5 py-0.5 rounded-full bg-[#8B5CF6] space-x-1">
                    <RankIcon className="w-2.5 h-2.5 text-white" />
                    <span className="text-[9px] font-bold text-white">{user.level}</span>
                </div>
            </div>
        </div>
        <div className="flex items-center text-[#F5C965] font-bold text-lg ml-2">
            <span>{formatScore(user.contribution)}</span>
            <YellowDiamondIcon className="w-4 h-4 ml-1" />
        </div>
    </div>
);

const ContributionRankingModal: React.FC<ContributionRankingModalProps> = ({ onClose, liveRanking }) => {
    const [activeTab, setActiveTab] = useState<Period>('Diária');
    const [data, setData] = useState<RankedUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Standardize live ranking data
    const liveData = useMemo(() => {
        if (!liveRanking) return [];
        return liveRanking
            .filter(u => u.value > 0)
            .map(u => ({
                ...u,
                contribution: u.value,
                gender: u.gender || 'not_specified',
                age: u.age || 18,
            } as RankedUser))
            .sort((a, b) => b.contribution - a.contribution);
    }, [liveRanking]);

    useEffect(() => {
        let isMounted = true;
        
        const fetchData = async () => {
            setIsLoading(true);
            setData([]); // Clear current data while loading
            
            // Artificial delay to simulate network/tab switch for smoother feel
            await new Promise(resolve => setTimeout(resolve, 300));

            if (!isMounted) return;

            if (activeTab === 'Live') {
                setData(liveData);
                setIsLoading(false);
            } else {
                const periodKeyMap: Record<string, 'daily' | 'weekly' | 'monthly'> = {
                    'Diária': 'daily',
                    'Semanal': 'weekly',
                    'Mensal': 'monthly'
                };
                
                const key = periodKeyMap[activeTab];
                if (key) {
                    try {
                        const result = await api.getRankingForPeriod(key);
                        if (isMounted) setData(result || []);
                    } catch (error) {
                        console.error(error);
                    } finally {
                        if (isMounted) setIsLoading(false);
                    }
                }
            }
        };

        fetchData();

        return () => { isMounted = false; };
    }, [activeTab, liveData]);

    return (
        <div className="absolute inset-0 bg-black/10 z-[60] flex items-end justify-center" onClick={onClose}>
            <div 
                className="bg-[#18191d] w-full h-[60%] max-w-md rounded-t-[30px] flex flex-col overflow-hidden shadow-2xl border-t border-white/5"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <header className="relative pt-5 px-4 bg-[#18191d] z-10 flex-shrink-0">
                    <div className="flex items-center justify-center relative mb-4">
                        <button onClick={onClose} className="absolute left-0 text-gray-400 hover:text-white p-2 -ml-2">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-bold text-white">Ranking de Contribuição</h2>
                    </div>
                    <div className="flex border-b border-white/10 mx-2">
                        {(['Live', 'Diária', 'Semanal', 'Mensal'] as Period[]).map((tab) => (
                            <RankingTab 
                                key={tab} 
                                label={tab} 
                                isActive={activeTab === tab} 
                                onClick={() => setActiveTab(tab)} 
                            />
                        ))}
                    </div>
                </header>

                {/* Content */}
                <main className="flex-grow overflow-y-auto no-scrollbar bg-[#18191d] pb-6 relative">
                    {isLoading ? (
                        <div className="absolute inset-0 flex justify-center items-center">
                            <LoadingSpinner />
                        </div>
                    ) : data.length > 0 ? (
                        <>
                            {/* Top 1 */}
                            <TopOne user={data[0]} />
                            
                            {/* List 2-N */}
                            <div className="mt-0">
                                {data.slice(1).map((user, index) => (
                                    <RankingListItem key={user.id} user={user} rank={index + 2} />
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                             <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
                                <RankIcon className="w-10 h-10 opacity-30" />
                            </div>
                            <p className="text-sm">Nenhum dado para este período</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ContributionRankingModal;
