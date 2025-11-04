import React, { useState, useEffect } from 'react';
import { User, RankedUser } from '../types';
import { BackIcon, YellowDiamondIcon, CrownIcon } from './icons';
import { useTranslation } from '../i18n';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';

const formatContribution = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.', ',') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
};

const FanItem: React.FC<{ user: RankedUser; rank: number; onClick: () => void }> = ({ user, rank, onClick }) => {
    const getRankColor = () => {
        if (rank === 1) return 'border-yellow-400';
        if (rank === 2) return 'border-gray-400';
        if (rank === 3) return 'border-yellow-600';
        return 'border-gray-700';
    };

    return (
        <div 
            className="flex items-center justify-between p-3 bg-[#1c1c1e] rounded-lg hover:bg-gray-800/50 cursor-pointer"
            onClick={onClick}
        >
            <div className="flex items-center space-x-4">
                <span className="w-8 text-center text-xl font-bold text-gray-300">{rank}</span>
                <img src={user.avatarUrl} alt={user.name} className={`w-14 h-14 rounded-full object-cover border-2 ${getRankColor()} bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900`} />
                <div>
                    <h3 className="font-semibold text-white flex items-center">{user.name} {rank === 1 && <CrownIcon className="w-5 h-5 ml-1 text-yellow-400" />}</h3>
                    <p className="text-sm text-gray-400">ID: {user.identification}</p>
                </div>
            </div>
            <div className="flex items-center space-x-1 text-yellow-400">
                <span className="font-semibold">{formatContribution(user.contribution)}</span>
                <YellowDiamondIcon className="w-4 h-4" />
            </div>
        </div>
    );
};

const TopFansScreen: React.FC<{ onBack: () => void; onViewProfile: (user: User) => void; }> = ({ onBack, onViewProfile }) => {
    const { t } = useTranslation();
    const [fans, setFans] = useState<RankedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.getRankingForPeriod('monthly')
            .then(data => {
                setFans(data || []);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, []);

    return (
        <div className="absolute inset-0 bg-[#111] z-50 flex flex-col text-white">
            <header className="flex items-center p-4 border-b border-gray-800 flex-shrink-0">
                <button onClick={onBack} className="absolute">
                    <BackIcon className="w-6 h-6" />
                </button>
                <div className="flex-grow text-center">
                    <h1 className="text-lg font-semibold">{t('userLists.topFans.title')}</h1>
                </div>
                <div className="w-6"></div>
            </header>
            <main className="flex-grow overflow-y-auto no-scrollbar p-4 space-y-3">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <LoadingSpinner />
                    </div>
                ) : (
                    fans.length > 0 ? (
                        fans.map((fan, index) => (
                            <FanItem key={fan.id} user={fan} rank={index + 1} onClick={() => onViewProfile(fan)} />
                        ))
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <p>Nenhum fã principal ainda.</p>
                        </div>
                    )
                )}
            </main>
        </div>
    );
};

export default TopFansScreen;