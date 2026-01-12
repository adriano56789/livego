import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, HexagonIcon, LockIcon, BanIcon, SolidDiamondIcon } from '../icons';
import { User } from '../../types';
import { api } from '../../services/api';
import { LoadingSpinner } from '../Loading';

interface ScreenProps {
    onClose: () => void;
    currentUser?: User | null; // currentUser is needed for LevelScreen
}

export const LevelScreen: React.FC<ScreenProps> = ({ onClose, currentUser }) => {
    if (!currentUser) return null;

    // Logic to calculate progress based on backend data
    // Assuming simplified logic: Next level requires Level * 1000 XP
    const currentLevel = currentUser.level || 1;
    const currentXP = currentUser.xp || 0;
    const nextLevelXP = currentLevel * 1000; 
    const progressPercent = Math.min(100, Math.max(0, (currentXP / nextLevelXP) * 100));

    return (
        <div className="fixed inset-0 bg-[#0A0A0A] z-50 flex flex-col font-sans animate-in slide-in-from-right duration-200">
            <div className="flex items-center p-4">
                <button onClick={onClose}><ChevronLeftIcon className="text-white w-6 h-6" /></button>
                <h1 className="flex-1 text-center text-white font-bold text-lg mr-6">Meu Nível</h1>
            </div>

            <div className="flex flex-col items-center mt-8">
                <div className="relative flex items-center justify-center">
                    <HexagonIcon className="w-32 h-32 text-purple-600" />
                    <span className="absolute text-5xl font-bold text-white mb-2">{currentLevel}</span>
                    {/* Next level faded */}
                    <div className="absolute -right-20 opacity-30 scale-75">
                         <HexagonIcon className="w-24 h-24 text-gray-600" />
                         <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white mb-1">{currentLevel + 1}</span>
                    </div>
                </div>
            </div>

            <div className="px-6 mt-12">
                <div className="flex justify-between text-sm font-bold text-white mb-2">
                    <span>Nível {currentLevel}</span>
                    <span>Nível {currentLevel + 1}</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <div className="text-center text-xs text-gray-500 mt-2 font-medium">
                    {currentXP} / {nextLevelXP} EXP
                </div>
            </div>

            <div className="px-6 mt-10">
                <h3 className="text-white font-bold mb-4">Privilégios Atuais (Nível {currentLevel})</h3>
                <div className="bg-[#1C1C1E] rounded-xl p-4 flex items-center gap-4">
                     <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                         <SolidDiamondIcon className="w-5 h-5 text-purple-500" />
                     </div>
                     <span className="text-gray-300 text-sm font-medium">Badge Nível {currentLevel}</span>
                 </div>
            </div>

            <div className="px-6 mt-6">
                 <h3 className="text-white font-bold mb-4">Próximas Recompensas (Nível {currentLevel + 1})</h3>
                 <div className="bg-[#1C1C1E] rounded-xl p-4 flex items-center gap-4 border border-white/5">
                     <div className="w-10 h-10 bg-gray-700/50 rounded-lg flex items-center justify-center">
                         <LockIcon className="w-5 h-5 text-gray-500" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-gray-300 text-sm font-medium">Badge Exclusivo Nv. {currentLevel + 1}</span>
                        <span className="text-gray-500 text-xs">Desbloqueia efeitos visuais no chat</span>
                     </div>
                 </div>
            </div>
        </div>
    );
};

export const TopFansScreen: React.FC<ScreenProps> = ({ onClose }) => {
    const [fans, setFans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTopFans = async () => {
            setLoading(true);
            try {
                // Call API instead of using static list
                // Comment: Cast to any to handle potential property access on wrapped API response.
                const data: any = await api.getTopFans();
                const safeData = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
                setFans(safeData);
            } catch (error) {
                console.error("Failed to load top fans", error);
                setFans([]);
            } finally {
                setLoading(false);
            }
        };
        loadTopFans();
    }, []);

    return (
        <div className="fixed inset-0 bg-[#0A0A0A] z-50 flex flex-col font-sans animate-in slide-in-from-right duration-200">
             <div className="flex items-center p-4 border-b border-gray-900 bg-[#0A0A0A]">
                <button onClick={onClose}><ChevronLeftIcon className="text-white w-6 h-6" /></button>
                <h1 className="flex-1 text-center text-white font-bold text-lg mr-6">Top Fãs (Global)</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-[#0A0A0A]">
                {loading ? (
                    <div className="flex justify-center mt-10"><LoadingSpinner /></div>
                ) : fans.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-60 text-gray-500">
                        <p>Ainda não há ranking de fãs.</p>
                    </div>
                ) : (
                    fans.map((fan, index) => (
                        <div key={fan.id || index} className="flex items-center bg-[#1C1C1E] p-3 rounded-lg mb-2 border border-white/5">
                             {/* Rank */}
                            <div className={`w-8 text-center font-bold text-lg mr-2 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-white'}`}>
                                {index + 1}
                            </div>
                            
                            {/* Avatar */}
                            <div className="relative mr-3">
                                <div className={`w-12 h-12 rounded-full p-[2px] ${index === 0 ? 'border-2 border-yellow-500' : (index === 1 ? 'border-2 border-gray-300' : (index === 2 ? 'border-2 border-orange-500' : ''))}`}>
                                    <img src={fan.avatar} className="w-full h-full rounded-full object-cover" alt={fan.name} />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className={`font-bold text-sm truncate flex items-center gap-1 text-white`}>
                                    {fan.name}
                                    {fan.isVip && <span className="text-yellow-500 text-[10px] ml-1">👑 VIP</span>}
                                </h3>
                                <p className="text-xs text-gray-500">ID: {fan.id}</p>
                            </div>

                            {/* Amount */}
                            <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded">
                                <span className="text-yellow-500 font-bold text-sm">{(fan.amount || 0).toLocaleString()}</span>
                                <SolidDiamondIcon className="w-3 h-3 text-yellow-500" />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export const BlockListScreen: React.FC<ScreenProps> = ({ onClose }) => {
    const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadBlockList = async () => {
            setLoading(true);
            try {
                // Comment: Cast to any to handle potential property access on wrapped API response.
                const data: any = await api.getBlocklist();
                const safeData = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
                setBlockedUsers(safeData);
            } catch (error) {
                console.error("Failed to load blocklist", error);
                setBlockedUsers([]);
            } finally {
                setLoading(false);
            }
        };
        loadBlockList();
    }, []);

    const handleUnblock = async (userId: string) => {
        try {
            await api.unblockUser(userId);
            setBlockedUsers(prev => prev.filter(u => u.id !== userId));
        } catch (error) {
            console.error("Failed to unblock", error);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#0A0A0A] z-50 flex flex-col font-sans animate-in slide-in-from-right duration-200">
             <div className="flex items-center p-4 border-b border-gray-800">
                <button onClick={onClose}><ChevronLeftIcon className="text-white w-6 h-6" /></button>
                <h1 className="flex-1 text-center text-white font-bold text-lg mr-6">Lista de Bloqueio</h1>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center mt-10"><LoadingSpinner /></div>
                ) : blockedUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center mt-20">
                        <div className="w-20 h-20 bg-[#1C1C1E] rounded-full flex items-center justify-center mb-6">
                            <BanIcon className="w-10 h-10 text-gray-500" />
                        </div>
                        <h2 className="text-white font-bold text-lg mb-2">Nenhum usuário bloqueado</h2>
                        <p className="text-gray-500 text-sm max-w-xs">
                            Você pode bloquear usuários no perfil deles ou em uma live para impedir que eles entrem em contato.
                        </p>
                    </div>
                ) : (
                    <div className="p-4 space-y-2">
                        {blockedUsers.map(user => (
                            <div key={user.id} className="flex items-center justify-between bg-[#1C1C1E] p-3 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <img src={user.avatarUrl} className="w-10 h-10 rounded-full object-cover" alt={user.name} />
                                    <span className="text-white font-bold text-sm">{user.name}</span>
                                </div>
                                <button 
                                    onClick={() => handleUnblock(user.id)}
                                    className="px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600"
                                >
                                    Desbloquear
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};