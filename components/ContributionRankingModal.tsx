
import React, { useState, useEffect } from 'react';
import { CloseIcon, CrownIcon, SolidDiamondIcon, StarIcon, VenusIcon, MarsIcon } from './icons';
import { User, RankedUser } from '../types';
import { LevelBadge } from './LevelBadge';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';

interface ContributionRankingModalProps {
    onClose: () => void;
    liveRanking: (User & { value: number })[];
}

export default function ContributionRankingModal({ onClose, liveRanking }: ContributionRankingModalProps) {
    const [activeTab, setActiveTab] = useState<'Live' | 'Diária' | 'Semanal' | 'Mensal'>('Live');
    const tabs = ['Live', 'Diária', 'Semanal', 'Mensal'];
    const [rankingData, setRankingData] = useState<RankedUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchRanking = async () => {
            if (activeTab === 'Live') {
                setRankingData(Array.isArray(liveRanking) ? (liveRanking as RankedUser[]) : []); 
                return;
            }
            setIsLoading(true);
            try {
                let data: any = [];
                switch(activeTab) {
                    case 'Diária': data = await api.getDailyRanking(); break;
                    case 'Semanal': data = await api.getWeeklyRanking(); break;
                    case 'Mensal': data = await api.getMonthlyRanking(); break;
                }
                // Normalize result to ensure it's an array
                const result = Array.isArray(data) ? data : (data?.data || []);
                setRankingData(result);
            } catch (error) { 
                console.error(error); 
                setRankingData([]);
            } finally { 
                setIsLoading(false); 
            }
        };
        fetchRanking();
    }, [activeTab, liveRanking]);

    // Defensive check to avoid "rankingData is not iterable"
    const sortedData = Array.isArray(rankingData) 
        ? [...rankingData].sort((a, b) => (b.value || 0) - (a.value || 0))
        : [];
        
    const topUser = sortedData.length > 0 ? sortedData[0] : null;
    const otherUsers = sortedData.slice(1);

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-transparent" onClick={onClose}>
            <div className="w-full bg-[#18181b] rounded-t-3xl h-[65vh] flex flex-col animate-in slide-in-from-bottom duration-300 relative shadow-2xl border-t border-white/5" onClick={e => e.stopPropagation()}>
                <div className="flex items-center p-4 relative justify-center">
                    <button onClick={onClose} className="absolute left-4 p-1"><CloseIcon className="w-5 h-5 text-gray-400" /></button>
                    <h2 className="text-white font-bold text-base">Ranking de Contribuição</h2>
                </div>

                <div className="flex px-6 border-b border-white/5">
                    {tabs.map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 pb-3 text-sm font-medium relative transition-colors ${activeTab === tab ? 'text-white font-bold' : 'text-gray-500'}`}>
                            {tab}
                            {activeTab === tab && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[#FFD700] rounded-full"></div>}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-6 no-scrollbar">
                    {isLoading ? (
                        <div className="flex justify-center mt-20"><LoadingSpinner /></div>
                    ) : sortedData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center mt-20 opacity-50">
                            <div className="w-24 h-24 rounded-full bg-[#2C2C2E] flex items-center justify-center mb-4"><StarIcon className="w-10 h-10 text-gray-500" /></div>
                            <p className="text-gray-500 text-sm">Nenhum dado para este período</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center pt-6">
                            {topUser && (
                                <div className="relative flex flex-col items-center mb-8 w-full">
                                    <div className="absolute -top-10 z-10"><CrownIcon className="w-12 h-12 text-[#FFD700] fill-[#FFD700]" /></div>
                                    <div className="relative mb-2">
                                        <div className="w-24 h-24 rounded-full p-[3px] border-2 border-[#FFD700]">
                                            <img src={topUser.avatarUrl} alt={topUser.name} className="w-full h-full rounded-full object-cover" />
                                        </div>
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#FFD700] text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border-2 border-[#18181b]">TOP 1</div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4 mb-1">
                                        <span className="text-[#FF8C69] text-xs">👑</span>
                                        <h3 className="text-[#FFD700] font-bold text-lg">{topUser.name}</h3>
                                        <span className="text-[#FF8C69] text-xs">👑</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <div className={`flex items-center rounded-full px-1.5 py-[1px] gap-0.5 min-w-[32px] justify-center ${topUser.gender === 'female' ? 'bg-[#FF4D80]' : 'bg-[#3b82f6]'}`}>
                                            {topUser.gender === 'female' ? <VenusIcon size={9} className="text-white fill-white" /> : <MarsIcon size={9} className="text-white fill-white" />}
                                            <span className="text-[9px] font-bold text-white">{topUser.age || 18}</span>
                                        </div>
                                        <LevelBadge level={topUser.level || 1} />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[#FFD700] font-black text-xl">{((topUser.value || 0) / 1000).toFixed(0)}K</span>
                                        <SolidDiamondIcon className="w-4 h-4 text-[#FFD700]" />
                                    </div>
                                </div>
                            )}

                            <div className="w-full flex flex-col gap-1">
                                {otherUsers.map((user, index) => {
                                    const rank = index + 2;
                                    return (
                                        <div key={user.id || index} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rank === 2 ? 'bg-[#C0C0C0] text-black' : (rank === 3 ? 'bg-[#CD7F32] text-black' : 'text-gray-500')}`}>{rank}</div>
                                                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden"><img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-sm">{user.name}</span>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <div className={`flex items-center rounded-full px-1.5 py-[1px] gap-0.5 min-w-[28px] justify-center ${user.gender === 'female' ? 'bg-[#FF4D80]' : 'bg-[#3b82f6]'}`}>
                                                            {user.gender === 'female' ? <VenusIcon size={8} className="text-white fill-white" /> : <MarsIcon size={8} className="text-white fill-white" />}
                                                            <span className="text-[8px] font-bold text-white">{user.age || 18}</span>
                                                        </div>
                                                        <LevelBadge level={user.level || 1} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1"><span className="text-[#FFD700] font-bold text-sm">{((user.value || 0) / 1000).toFixed(0)}K</span><SolidDiamondIcon className="w-3 h-3 text-[#FFD700]" /></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
