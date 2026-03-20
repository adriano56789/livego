import React, { useState, useEffect } from 'react';
import { CloseIcon, ActionIcon, YellowDiamondIcon, CrownIcon, UserIcon, RankIcon } from '../icons';
import { User } from '../../types';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import { LoadingSpinner } from '../Loading';

interface OnlineUsersModalProps {
    onClose: () => void;
    streamId: string;
    userId: string;
    currentUser?: User | null; // Para sincronizar avatar do usuário atual em tempo real
}

const UserItem: React.FC<{ user: User & { value: number }; rank: number }> = ({ user, rank }) => {
    const getRankIcon = () => {
        if (rank === 1) return <CrownIcon className="w-6 h-6 text-yellow-400" />;
        if (rank === 2) return <div className="w-6 h-6 flex items-center justify-center font-bold text-gray-300 bg-gray-600 rounded-full text-sm">2</div>;
        if (rank === 3) return <div className="w-6 h-6 flex items-center justify-center font-bold text-yellow-700 bg-yellow-900/50 rounded-full text-sm">3</div>;
        return <span className="w-6 text-center text-lg font-semibold text-gray-400">{rank}</span>;
    };
    
    // Proteção contra dados inválidos
    if (!user || !user.id) {
        return null;
    }
    
    return (
        <div className="flex items-center justify-between p-3">
            <div className="flex items-center space-x-3">
                <div className="w-8 flex justify-center">{getRankIcon()}</div>
                <div className="relative">
                    <img 
                        src={user.avatarUrl ? `${user.avatarUrl}${user.avatarUrl.includes('?') ? '&' : '?'}v=${user.avatarUrl.slice(-12)}` : undefined} 
                        alt={user.name || 'Usuário'} 
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                            // Se falhar, mostrar placeholder fixo baseado no ID
                            e.currentTarget.src = `https://picsum.photos/seed/user-${user.id}/100/100.jpg`;
                        }}
                    />
                    {/* Diamantes descendo ao lado do avatar - igual Bingo Live */}
                    {user.value > 0 && (
                        <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-0.5 flex items-center space-x-0.5 shadow-lg border-2 border-yellow-500">
                            <YellowDiamondIcon className="h-2.5 w-2.5 text-yellow-900" />
                            <span className="text-[10px] font-black text-yellow-900 leading-none">{user.value}</span>
                        </div>
                    )}
                </div>
                <div>
                    <p className="font-semibold text-white">{user.name || 'Usuário'}</p>
                    <div className="flex items-center space-x-2 mt-1">
                        <span className="bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center space-x-1">
                            <RankIcon className="h-3 w-3" />
                            <span>{user.level || 1}</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};


const OnlineUsersModal: React.FC<OnlineUsersModalProps> = ({ onClose, streamId, userId }) => {
    const [users, setUsers] = useState<(User & { value: number })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Calcular total de diamantes enviados na live
    const totalDiamonds = users.reduce((sum, user) => sum + (user.value || 0), 0);

    useEffect(() => {
        // Conectar à sala da stream para receber atualizações em tempo real
        socketService.joinRoom(streamId);

        // Handler para quando presente é enviado para a stream
        const handleGiftSent = async (data: { streamId: string; gift: { fromUserId: string; totalValue: number } }) => {
            if (data.streamId === streamId) {
                // Recarregar usuários para atualizar os valores enviados
                try {
                    const updatedUsers = await api.getOnlineUsers(userId, streamId);
                    if (Array.isArray(updatedUsers)) {
                        setUsers(updatedUsers);
                    }
                } catch (error) {
                    console.error('Erro ao atualizar usuários após presente:', error);
                }
            }
        };

        // Handler para quando live é encerrada (zerar valores)
        const handleStreamEnded = (data: { streamId: string }) => {
            if (data.streamId === streamId) {
                // Zerar valores de todos os usuários
                setUsers(prevUsers => 
                    prevUsers.map(user => ({ ...user, value: 0 }))
                );
            }
        };

        // Registrar listeners
        socketService.onGiftSentToStream(handleGiftSent);
        socketService.onStreamEnded(handleStreamEnded);

        // Initial fetch - APENAS UMA CHAMADA
        const fetchUsers = async () => {
            try {
                if (!streamId || typeof streamId !== 'string') {
                    throw new Error('ID da stream inválido');
                }
                
                const data = await api.getOnlineUsers(userId, streamId);
                
                console.log('🔍 [ONLINE USERS MODAL] API retornou:', data);
                
                if (Array.isArray(data)) {
                    const validUsers = data.filter(user => 
                        user && 
                        typeof user === 'object' && 
                        user.id && 
                        user.name
                    );
                    setUsers(validUsers);
                } else {
                    setUsers([]);
                }
                
                setError(null);
            } catch (err) {
                setError('Não foi possível carregar os usuários');
                setUsers([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
        
        return () => {
            // Cleanup: remover listeners e sair da sala
            socketService.off('gift_sent_to_stream', handleGiftSent);
            socketService.off('stream_ended', handleStreamEnded);
            socketService.leaveRoom(streamId);
        };
    }, [streamId]);

    return (
        <div className="absolute inset-0 z-50 flex items-end" onClick={onClose}>
            <div 
                className="bg-gradient-to-b from-[#3a2558] to-[#2c1d43] w-full max-w-md h-2/3 rounded-t-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 flex-shrink-0 border-b border-white/10">
                    <button onClick={onClose} className="text-gray-300 hover:text-white">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                    <h2 className="font-bold text-lg text-white">Usuários Online ({users.length})</h2>
                    <button className="text-gray-300 hover:text-white">
                        <ActionIcon className="w-6 h-6" />
                    </button>
                </header>
                <main className="flex-grow overflow-y-auto no-scrollbar">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <LoadingSpinner />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center p-4">
                            <UserIcon className="w-16 h-16 mb-4" />
                            <p className="font-semibold text-red-400">Erro ao carregar</p>
                            <p className="text-sm">{error}</p>
                            <button 
                                onClick={() => window.location.reload()}
                                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                Tentar novamente
                            </button>
                        </div>
                    ) : usersWithFreshAvatar.length > 0 ? (
                        usersWithFreshAvatar.map((user, index) => (
                            <UserItem key={user.id || `user-${index}`} user={user} rank={index + 1} />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center p-4">
                            <UserIcon className="w-16 h-16 mb-4" />
                            <p className="font-semibold">Nenhum usuário encontrado</p>
                            <p className="text-sm">Tente novamente mais tarde</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default OnlineUsersModal;