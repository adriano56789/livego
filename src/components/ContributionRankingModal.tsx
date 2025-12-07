import React, { useState, useEffect, useCallback, useRef } from 'react';
// FIX: Import 'RankIcon', 'RankedUser', and 'User' to resolve type and component errors.
import { CloseIcon, YellowDiamondIcon, CrownIcon } from './icons';
import { FaSync as RefreshIcon } from 'react-icons/fa';
import { FaVenus as FemaleIcon, FaMars as MaleIcon, FaStar as RankIcon } from 'react-icons/fa';
import { RankedUser, User } from '../types';
import { api } from '../../services/api';
import { LoadingSpinner } from './Loading';

// FIX: Added 'Live' to the Period type to support live ranking.
type Period = 'Live' | 'Diária' | 'Semanal' | 'Mensal';
type PeriodKey = 'daily' | 'weekly' | 'monthly';

const formatContribution = (num: number) => {
    const numericValue = Number(num);
    if (num === null || num === undefined || isNaN(numericValue)) {
        return '0';
    }
    if (numericValue >= 1000000) return (numericValue / 1000000).toFixed(1).replace('.', ',') + 'M';
    if (numericValue >= 1000) return (numericValue / 1000).toFixed(0) + 'K';
    return numericValue.toString();
};

const GenderAgeBadge: React.FC<{ user: RankedUser }> = ({ user }) => {
    const isMale = user.gender === 'male';
    return (
        <span className={`text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center space-x-1 ${isMale ? 'bg-blue-500' : 'bg-pink-500'}`}>
            {isMale ? <MaleIcon className="h-3 w-3" /> : <FemaleIcon className="h-3 w-3" />}
            <span>{user.age}</span>
        </span>
    );
};

// FIX: Updated 'LevelBadge' component to use RankIcon and a different color for consistency.
const LevelBadge: React.FC<{ user: RankedUser }> = ({ user }) => (
    <span className="bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center space-x-1">
        <RankIcon className="h-3 w-3" />
        <span>{user.level}</span>
    </span>
);

// FIX: Add 'liveRanking' to the props interface to accept live data.
interface ContributionRankingModalProps {
    onClose: () => void;
    liveRanking?: (User & { value: number })[];
}

// FIX: Updated component signature to accept the new 'liveRanking' prop.
const ContributionRankingModal: React.FC<ContributionRankingModalProps> = ({ onClose, liveRanking }) => {
    const [activeTab, setActiveTab] = useState<Period>('Live');
    const [data, setData] = useState<RankedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    // Rola para o topo quando o modal é aberto
    useEffect(() => {
        if (modalRef.current) {
            modalRef.current.scrollTop = 0;
        }
    }, [activeTab, data]);

    const fetchRankingData = useCallback(async () => {
        const periodMap: Record<Period, PeriodKey | 'live'> = {
            'Live': 'live',
            'Diária': 'daily',
            'Semanal': 'weekly',
            'Mensal': 'monthly',
        };
        
        const currentPeriod = periodMap[activeTab];

        try {
            setIsRefreshing(true);
            if (currentPeriod === 'live') {
                const mappedData = (liveRanking || [])
                    .filter(u => u.value > 0)
                    .map(u => ({
                        ...u,
                        contribution: u.value,
                        gender: u.gender || 'not_specified',
                        age: u.age || 0,
                    } as RankedUser));
                setData(mappedData);
            } else {
                const rankingData = await api.getRankingForPeriod(currentPeriod as PeriodKey);
                setData(rankingData || []);
            }
        } catch (error) {
            console.error('Error fetching ranking data:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [activeTab, liveRanking]);

    useEffect(() => {
        fetchRankingData();
    }, [fetchRankingData]);

    const handleRefresh = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        fetchRankingData();
    }, [fetchRankingData]);

    const topUser = data[0];
    const otherUsers = data.slice(1);

    return (
        <div 
            className="absolute inset-0 bg-black/60 z-40 flex items-end justify-center" 
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ranking-modal-title"
        >
            <div
                ref={modalRef}
                className="bg-[#2d2d3a] w-full max-w-md h-[85%] rounded-t-2xl flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
                onTouchMove={e => e.stopPropagation()}
            >
                <header className="flex-shrink-0 p-4">
                    <div className="flex justify-between items-center mb-4 relative">
                        <button onClick={onClose} className="text-gray-400 hover:text-white absolute left-0 top-1/2 -translate-y-1/2">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                        <h2 id="ranking-modal-title" className="text-xl font-bold text-white text-center w-full">Ranking de Contribuição</h2>
                        <button 
                            onClick={handleRefresh} 
                            className={`text-gray-400 hover:text-white absolute right-0 top-1/2 -translate-y-1/2 ${isRefreshing ? 'animate-spin' : ''}`}
                            disabled={isRefreshing}
                        >
                            <RefreshIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <nav className="flex items-center justify-center space-x-6">
                        {/* FIX: Added 'Live' tab to the navigation. */}
                        {(['Live', 'Diária', 'Semanal', 'Mensal'] as Period[]).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`text-base font-semibold transition-colors relative py-1 ${activeTab === tab ? 'text-white' : 'text-gray-500'}`}>
                                {tab}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full"></div>}
                            </button>
                        ))}
                    </nav>
                </header>
                <main 
                    className="flex-grow overflow-y-auto no-scrollbar px-4 pb-4"
                    onTouchStart={e => e.stopPropagation()}
                    onTouchMove={e => e.stopPropagation()}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <LoadingSpinner />
                        </div>
                    ) : (
                    <>
                        {/* Top 1 User */}
                        {topUser && (
                            <div className="flex flex-col items-center my-4 p-4">
                                <div className="relative mb-3">
                                    <img src={topUser.avatarUrl} alt={topUser.name} className="w-28 h-28 rounded-full object-cover border-4 border-yellow-400" />
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <CrownIcon className="w-10 h-10 text-yellow-400" />
                                    </div>
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10 shadow-[0_0_10px_2px_rgba(0,0,0,0.3)]">
                                        TOP 1
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-white">{topUser.name}</h3>
                                <div className="flex items-center space-x-2 my-2">
                                    <GenderAgeBadge user={topUser} />
                                    <LevelBadge user={topUser} />
                                </div>
                                <div className="flex items-center space-x-2 text-yellow-400">
                                    <span className="text-3xl font-bold">{formatContribution(topUser.contribution)}</span>
                                    <YellowDiamondIcon className="w-6 h-6" />
                                </div>
                            </div>
                        )}
                        
                        {/* Other Users */}
                        <div className="space-y-3">
                            {otherUsers.map((user, index) => (
                                <div key={user.id} className="flex items-center p-2">
                                    <span className={`w-8 h-8 flex items-center justify-center font-bold text-lg rounded-full shadow-md ${index + 2 === 2 || index + 2 === 3 ? 'bg-black text-white border-2 border-yellow-400' : 'bg-white text-black'}`}>
                                        {index + 2}
                                    </span>
                                    <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover mx-3" />
                                    <div className="flex-grow min-w-0">
                                        <p className="font-bold text-white truncate">{user.name}</p>
                                        <div className="flex items-center space-x-1 mt-1">
                                            <GenderAgeBadge user={user} />
                                            <LevelBadge user={user} />
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-1 text-yellow-400 ml-2">
                                        <span className="font-semibold">{formatContribution(user.contribution)}</span>
                                        <YellowDiamondIcon className="w-4 h-4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                    )}
                </main>
            </div>
        </div>
    );
};

// Previne o comportamento padrão de rolagem no modal
const stopPropagation = (e: React.TouchEvent) => {
    e.stopPropagation();
};

export default React.memo(ContributionRankingModal, (prevProps, nextProps) => {
    // Só re-renderiza se as props relevantes mudarem
    return (
        prevProps.liveRanking === nextProps.liveRanking &&
        prevProps.onClose === nextProps.onClose
    );
});