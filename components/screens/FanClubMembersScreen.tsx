import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, StarIcon, TrophyIcon, ShieldIcon, InfoIcon, SolidDiamondIcon } from '../icons';
import { User } from '../../types';
import { LevelBadge } from '../LevelBadge';
import { api } from '../../services/api';
import { LoadingSpinner } from '../Loading';

interface FanClubMembersScreenProps {
    streamer: User;
    onClose: () => void;
    onViewProfile: (user: User) => void;
}

const FanClubMembersScreen: React.FC<FanClubMembersScreenProps> = ({ streamer, onClose, onViewProfile }) => {
    const [members, setMembers] = useState<(User & { points: number })[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'Ranking' | 'Regras'>('Ranking');

    useEffect(() => {
        const fetchMembers = async () => {
            if (!streamer?.id) {
                setLoading(false);
                setMembers([]);
                return;
            }

            setLoading(true);
            try {
                const data = await api.users.getFansUsers(streamer.id);
                // API returns User[], add mock 'points' for UI ranking
                const membersWithPoints = data
                    .map((user, index) => ({
                        ...user,
                        points: (50 - (user.level || 1)) * 1000 + Math.floor(Math.random() * 1000)
                    }))
                    .sort((a, b) => b.points - a.points);

                setMembers(membersWithPoints);
            } catch (e) {
                console.error("Failed to fetch fan club members:", e);
                setMembers([]);
            } finally {
                setLoading(false);
            }
        };
        fetchMembers();
    }, [streamer.id]);

    const top3 = members.slice(0, 3);
    const others = members.slice(3);

    return (
        <div className="fixed inset-0 bg-[#121212] z-[150] flex flex-col font-sans animate-in slide-in-from-right duration-300 select-none">
            {/* Header */}
            <div className="flex items-center p-4 border-b border-white/5 bg-[#121212] sticky top-0 z-10">
                <button onClick={onClose} className="p-2 -ml-2">
                    <ChevronLeftIcon className="w-6 h-6 text-white" />
                </button>
                <div className="flex-1 text-center">
                    <h1 className="text-white font-black text-base">Grupo de Fãs</h1>
                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">{streamer.name}</p>
                </div>
                <button className="p-2 -mr-2 text-gray-400">
                    <InfoIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 bg-[#121212]">
                <button 
                    onClick={() => setActiveTab('Ranking')}
                    className={`flex-1 py-3 text-sm font-black relative transition-all ${activeTab === 'Ranking' ? 'text-white' : 'text-gray-500'}`}
                >
                    Ranking
                    {activeTab === 'Ranking' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-purple-500 rounded-full"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('Regras')}
                    className={`flex-1 py-3 text-sm font-black relative transition-all ${activeTab === 'Regras' ? 'text-white' : 'text-gray-500'}`}
                >
                    Benefícios
                    {activeTab === 'Regras' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-purple-500 rounded-full"></div>}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-10">
                {activeTab === 'Ranking' ? (
                    loading ? (
                        <div className="flex justify-center mt-20"><LoadingSpinner /></div>
                    ) : (
                        <div className="flex flex-col">
                            {/* Podium Top 3 */}
                            <div className="flex justify-center items-end gap-4 py-10 bg-gradient-to-b from-purple-900/20 to-transparent">
                                {/* Rank 2 */}
                                {top3[1] && (
                                    <div className="flex flex-col items-center gap-2" onClick={() => onViewProfile(top3[1])}>
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-full border-2 border-gray-400 p-1">
                                                <img src={top3[1].avatarUrl} className="w-full h-full rounded-full object-cover" alt="" />
                                            </div>
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gray-400 text-black font-black text-[10px] px-2 rounded-full">2</div>
                                        </div>
                                        <span className="text-white text-xs font-bold truncate w-20 text-center">{top3[1].name}</span>
                                        <LevelBadge level={top3[1].level} />
                                    </div>
                                )}
                                {/* Rank 1 */}
                                {top3[0] && (
                                    <div className="flex flex-col items-center gap-2 -mt-4 scale-110" onClick={() => onViewProfile(top3[0])}>
                                        <div className="relative">
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400">
                                                <TrophyIcon className="w-8 h-8 fill-current" />
                                            </div>
                                            <div className="w-20 h-20 rounded-full border-4 border-yellow-500 p-1 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                                                <img src={top3[0].avatarUrl} className="w-full h-full rounded-full object-cover" alt="" />
                                            </div>
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-yellow-500 text-black font-black text-[10px] px-2 rounded-full">1</div>
                                        </div>
                                        <span className="text-white text-sm font-black truncate w-24 text-center">{top3[0].name}</span>
                                        <LevelBadge level={top3[0].level} />
                                    </div>
                                )}
                                {/* Rank 3 */}
                                {top3[2] && (
                                    <div className="flex flex-col items-center gap-2" onClick={() => onViewProfile(top3[2])}>
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-full border-2 border-orange-400 p-1">
                                                <img src={top3[2].avatarUrl} className="w-full h-full rounded-full object-cover" alt="" />
                                            </div>
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-orange-400 text-black font-black text-[10px] px-2 rounded-full">3</div>
                                        </div>
                                        <span className="text-white text-xs font-bold truncate w-20 text-center">{top3[2].name}</span>
                                        <LevelBadge level={top3[2].level} />
                                    </div>
                                )}
                            </div>

                            {/* Others List */}
                            <div className="px-4 space-y-1">
                                {others.map((member, i) => (
                                    <div key={member.id} onClick={() => onViewProfile(member)} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 active:bg-white/10 transition-all">
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-500 font-black text-sm w-5 text-center">{i + 4}</span>
                                            <img src={member.avatarUrl} className="w-11 h-11 rounded-full border border-white/10" alt="" />
                                            <div className="flex flex-col">
                                                <span className="text-white text-sm font-bold">{member.name}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <LevelBadge level={member.level} />
                                                    <span className="text-[10px] text-purple-400 font-black">NV.{Math.floor(member.points/1000)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-1">
                                                <span className="text-yellow-500 font-black text-xs">{(member.points || 0).toLocaleString()}</span>
                                                <SolidDiamondIcon className="w-3 h-3 text-yellow-500" />
                                            </div>
                                            <span className="text-[9px] text-gray-500 font-bold uppercase">Pontos</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                ) : (
                    <div className="p-6 space-y-6">
                        <div className="bg-purple-600/10 border border-purple-500/20 rounded-3xl p-5">
                            <h3 className="text-purple-400 font-black text-sm mb-3 flex items-center gap-2">
                                <ShieldIcon className="w-4 h-4" /> Benefícios de Membro
                            </h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center shrink-0 text-[10px] font-bold">1</div>
                                    <p className="text-gray-300 text-xs leading-relaxed">Emblema exclusivo ao lado do nome em todas as lives deste streamer.</p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center shrink-0 text-[10px] font-bold">2</div>
                                    <p className="text-gray-300 text-xs leading-relaxed">Mensagem de entrada personalizada ao entrar na sala.</p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center shrink-0 text-[10px] font-bold">3</div>
                                    <p className="text-gray-300 text-xs leading-relaxed">Prioridade em pedidos de música e interação direta.</p>
                                </li>
                            </ul>
                        </div>
                        
                        <div className="text-center px-4">
                            <p className="text-gray-500 text-xs italic">"Ser um fã não é apenas dar presentes, é apoiar o talento e fazer parte da história."</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FanClubMembersScreen;