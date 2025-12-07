import React, { useState, useEffect } from 'react';
import { CloseIcon, ActionIcon, YellowDiamondIcon, UserIcon } from '../icons';
import { User } from '../../types';
import { api } from '../../services/api';
import { LoadingSpinner } from '../Loading';
import { webSocketManager } from '../../services/websocket';

interface OnlineUsersModalProps {
    onClose: () => void;
    streamId: string;
}

const UserItem: React.FC<{ user: User & { value: number }; rank: number }> = ({ user, rank }) => {
    const CrownIcon = ({ className = '' }) => (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14.3-.3l1.1-6.3-3.2 2.1L15 7l-2 7H8L5 11.9l-1.1 6.3L12 20l7.3-4.3z" />
        </svg>
    );

    const StarIcon = ({ className = '' }) => (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" />
        </svg>
    );

    const TrophyIcon = ({ className = '' }) => (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
        </svg>
    );

    const getRankIcon = () => {
        const baseClass = "w-7 h-7 flex items-center justify-center rounded-full bg-black";
        
        return (
            <div className={baseClass}>
                <span className="text-sm font-bold text-white">{rank}</span>
            </div>
        );
    };
    
    return (
        <div className="flex items-center justify-between p-3">
            <div className="flex items-center space-x-3">
                <div className="w-8 flex justify-center">{getRankIcon()}</div>
                <div className="relative">
                    <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" />
                </div>
                <div>
                    <p className="font-semibold text-white">{user.name}</p>
                    <p className="text-sm text-gray-400">ID: {user.identification}</p>
                </div>
            </div>
            <div className="flex items-center space-x-1 text-yellow-400">
                <span className="font-bold text-lg">{user.value.toLocaleString('pt-BR')}</span>
                <YellowDiamondIcon className="w-5 h-5" />
            </div>
        </div>
    );
};


const OnlineUsersModal: React.FC<OnlineUsersModalProps> = ({ onClose, streamId }) => {
    const [users, setUsers] = useState<(User & { value: number })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const [userCount, setUserCount] = useState(0);
    const usersRef = React.useRef<(User & { value: number })[]>([]);
    const isMounted = React.useRef(true);

    const updateUsers = React.useCallback((newUsers: (User & { value: number })[]) => {
        if (!isMounted.current) return;
        
        const currentUsers = [...newUsers];
        
        setUsers(prevUsers => {
            const prevUsersMap = new Map(prevUsers.map(u => [u.id, u]));
            let hasChanges = false;
            
            if (prevUsers.length !== currentUsers.length) {
                hasChanges = true;
            } else {
                for (let i = 0; i < currentUsers.length; i++) {
                    const newUser = currentUsers[i];
                    const oldUser = prevUsersMap.get(newUser.id);
                    
                    if (!oldUser || oldUser.value !== newUser.value) {
                        hasChanges = true;
                        break;
                    }
                }
            }
            
            return hasChanges ? [...currentUsers] : prevUsers;
        });
        
        usersRef.current = currentUsers;
        setUserCount(currentUsers.length);
    }, []);

    useEffect(() => {
        isMounted.current = true;
        
        const loadInitialUsers = async () => {
            try {
                const data = await api.getOnlineUsers(streamId);
                if (isMounted.current) {
                    updateUsers(data || []);
                }
            } catch (error) {
                console.error('Erro ao carregar usuários online:', error);
            } finally {
                if (isMounted.current) {
                    setIsLoading(false);
                }
            }
        };
        
        loadInitialUsers();
        
        return () => {
            isMounted.current = false;
        };
    }, [streamId, updateUsers]);

    useEffect(() => {
        const handleUpdate = (data: { roomId: string; users: (User & { value: number })[] }) => {
            if (data.roomId === streamId) {
                updateUsers(data.users);
            }
        };

        webSocketManager.on('onlineUsersUpdate', handleUpdate);
        
        return () => {
            webSocketManager.off('onlineUsersUpdate', handleUpdate);
        };
    }, [streamId, updateUsers]);

    return (
        <div className="absolute inset-0 z-50 flex items-end justify-center" onClick={onClose}>
            <div 
                className="bg-gradient-to-b from-[#3a2558] to-[#2c1d43] w-full max-w-md max-h-[50vh] rounded-t-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 flex-shrink-0 border-b border-white/10">
                    <button onClick={onClose} className="text-gray-300 hover:text-white">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                    <h2 className="font-bold text-lg text-white">Usuários Online ({userCount})</h2>
                    <button 
                        className="text-gray-300 hover:text-white flex items-center justify-center w-6 h-6"
                        onClick={async (e) => {
                            e.stopPropagation();
                            if (isLoading) return;
                            
                            setIsLoading(true);
                            try {
                                const data = await api.getOnlineUsers(streamId);
                                updateUsers(data || []);
                            } catch (error) {
                                console.error('Error refreshing users:', error);
                            } finally {
                                setIsLoading(false);
                            }
                        }}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <ActionIcon className="w-6 h-6" />
                        )}
                    </button>
                </header>
                <main className="flex-grow overflow-y-auto no-scrollbar" style={{ contain: 'content' }}>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <LoadingSpinner />
                        </div>
                    ) : users.length > 0 ? (
                        users.map((user, index) => (
                            <UserItem key={user.id} user={user} rank={index + 1} />
                        ))
                    ) : (
                         <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center p-4">
                            <UserIcon className="w-16 h-16 mb-4" />
                            <p className="font-semibold">Nenhum outro usuário na sala</p>
                            <p className="text-sm">Você é o primeiro a chegar!</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default OnlineUsersModal;