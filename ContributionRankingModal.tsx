
import React, { useState, useEffect } from 'react';
import { CloseIcon, YellowDiamondIcon, CrownIcon, FemaleIcon, MaleIcon, RankIcon } from './icons';
import { RankedUser, User } from './types';
import { api } from './services/api';
import { LoadingSpinner } from './components/Loading';

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

const LevelBadge: React.FC<{ user: RankedUser }> = ({ user }) => (
    <span className="bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center space-x-1">
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

    return (
        <div className="absolute inset-0 bg-black/60 z-40 flex items-end justify-center" onClick={onClose}>
            <div
                className="bg-[#2d2d3a] w-full max-w-md h-[85%] rounded-t-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex-shrink-0 p-4">
                    <div className="flex justify-between items-center mb-4 relative">
                        <button onClick={onClose} className="text-gray-400 hover:text-white absolute left-0 top-1/2 -translate-y-1/2">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-bold text-white text-center w-full">Ranking de Contribuição</h2>
                    </div>
                    <nav className="flex items-center justify-center space-x-6">
                        {(['Live', 'Diária', 'Semanal', 'Mensal'] as Period[]).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`text-base font-semibold transition-colors relative py-1 ${activeTab === tab ? 'text-white' : 'text-gray-500'}`}>
                                {tab}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full"></div>}
                            </button>
                        ))}
                    </nav>
                </header>
                <main className="flex-grow overflow-y-auto no-scrollbar px-4 pb-4">
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
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full">
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
                                    <span className="w-8 text-center text-gray-200 font-semibold text-lg">{index + 2}</span>
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

export default ContributionRankingModal;