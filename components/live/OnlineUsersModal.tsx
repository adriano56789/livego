import React, { useState, useEffect } from 'react';
import { CloseIcon, ActionIcon, YellowDiamondIcon, CrownIcon, UserIcon } from '../icons';
import { User } from '../../types';
import { api } from '../../services/api';
import { LoadingSpinner } from '../Loading';
import { webSocketManager } from '../../services/websocket';

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
    
    return (
        <div className="flex items-center justify-between p-3">
            <div className="flex items-center space-x-3">
                <div className="w-8 flex justify-center">{getRankIcon()}</div>
                <div className="relative">
                    <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
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

    useEffect(() => {
        const handleUpdate = (data: { roomId: string; users: (User & { value: number })[] }) => {
            if (data.roomId === streamId) {
                setUsers(data.users);
            }
        };

        webSocketManager.on('onlineUsersUpdate', handleUpdate);

        // Initial fetch
        setIsLoading(true);
        api.getOnlineUsers(streamId)
            .then(data => {
                setUsers(data || []);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
        
        return () => webSocketManager.off('onlineUsersUpdate', handleUpdate);
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