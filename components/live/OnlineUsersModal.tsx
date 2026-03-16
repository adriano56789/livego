import React, { useState, useEffect } from 'react';
import { CloseIcon, ActionIcon, YellowDiamondIcon, CrownIcon, UserIcon } from '../icons';
import { User } from '../../types';
import { api } from '../../services/api';
import { LoadingSpinner } from '../Loading';

interface OnlineUsersModalProps {
    onClose: () => void;
    streamId: string;
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
                        src={user.avatarUrl || 'https://picsum.photos/seed/default-avatar/200/200.jpg'} 
                        alt={user.name || 'Usuário'} 
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                            e.currentTarget.src = 'https://picsum.photos/seed/fallback-avatar/200/200.jpg';
                        }}
                    />
                </div>
                <div>
                    <p className="font-semibold text-white">{user.name || 'Usuário'}</p>
                    <p className="text-sm text-gray-400">ID: {user.identification || user.id}</p>
                </div>
            </div>
            <div className="flex items-center space-x-1 text-yellow-400">
                <span className="font-bold text-lg">{(user.value || 0).toLocaleString('pt-BR')}</span>
                <YellowDiamondIcon className="w-5 h-5" />
            </div>
        </div>
    );
};


const OnlineUsersModal: React.FC<OnlineUsersModalProps> = ({ onClose, streamId }) => {
    const [users, setUsers] = useState<(User & { value: number })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleUpdate = (data: { roomId: string; users: (User & { value: number })[] }) => {
            if (data.roomId === streamId) {
                setUsers(data.users || []);
                setError(null);
            }
        };

        // Simplificado - sem WebSocket para navegação isolada
        // webSocketManager.on('onlineUsersUpdate', handleUpdate);

        // Initial fetch com tratamento de erro robusto
        setIsLoading(true);
        setError(null);
        
        const fetchUsers = async () => {
            try {
                // Validar streamId
                if (!streamId || typeof streamId !== 'string') {
                    throw new Error('ID da stream inválido');
                }

                
                const data = await api.getOnlineUsers(streamId);
                
                // Validar resposta da API
                if (!data) {
                    setUsers([]);
                } else if (!Array.isArray(data)) {
                    setUsers([]);
                } else {
                    // Validar cada usuário
                    const validUsers = data.filter(user => 
                        user && 
                        typeof user === 'object' && 
                        user.id && 
                        user.name
                    );
                    
                    if (validUsers.length !== data.length) {
                    }
                    
                    setUsers(validUsers);
                }
                
                setError(null);
            } catch (err) {
                setError('Não foi possível carregar os usuários');
                setUsers([]); // Garantir array vazio em caso de erro
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
        
        return () => {
            // Simplificado - sem WebSocket para navegação isolada
            // webSocketManager.off('onlineUsersUpdate', handleUpdate);
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
                    ) : users.length > 0 ? (
                        users.map((user, index) => (
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