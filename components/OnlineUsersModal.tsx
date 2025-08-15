
import React, { useState, useEffect, useCallback } from 'react';
import type { Viewer } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import CrossIcon from './icons/CrossIcon';
import RefreshIcon from './icons/RefreshIcon';

interface OnlineUsersModalProps {
  liveId: number;
  onClose: () => void;
  onUserClick: (userId: number) => void;
}

const formatContribution = (num: number): string => {
    if (num >= 1000) {
        return (num / 1000).toFixed(2).replace(/\.00$/, '') + 'K';
    }
    return num.toString();
};

const UserListItem: React.FC<{ user: Viewer, onUserClick: (userId: number) => void }> = ({ user, onUserClick }) => (
    <button onClick={() => onUserClick(user.id)} className="flex items-center gap-3 p-2 rounded-lg w-full hover:bg-white/5">
        <div className="relative w-12 h-12 shrink-0">
            <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
             <div className="absolute inset-0 rounded-full border-2 border-yellow-400 shadow-lg" style={{boxShadow: '0 0 10px #facc15'}}></div>
        </div>
        <div className="flex-grow text-left overflow-hidden">
            <p className="font-semibold text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-400">ID: {user.id}</p>
        </div>
        <p className="font-bold text-yellow-400">{formatContribution(user.contribution)}</p>
    </button>
);

const OnlineUsersModal: React.FC<OnlineUsersModalProps> = ({ liveId, onClose, onUserClick }) => {
    const [users, setUsers] = useState<Viewer[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. FRONTEND: O componente do modal chama o serviço para buscar os espectadores.
            // Isso simula uma chamada de API real para o endpoint GET /api/lives/:liveId/viewers.
            const data = await liveStreamService.getViewers(liveId);
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch online users:", error);
        } finally {
            setIsLoading(false);
        }
    }, [liveId]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end" onClick={onClose}>
            <div className="bg-gradient-to-b from-[#1E1B4B] to-[#141026] w-full h-[60vh] rounded-t-2xl flex flex-col border-t-2 border-purple-400/50" onClick={e => e.stopPropagation()}>
                <header className="p-4 flex items-center justify-between border-b border-white/10 shrink-0">
                    <button onClick={onClose}><CrossIcon className="w-6 h-6 text-gray-400" /></button>
                    <h2 className="text-lg font-bold">Usuários Online ({users.length})</h2>
                    <button onClick={fetchUsers} disabled={isLoading}>
                       {isLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <RefreshIcon className="w-6 h-6 text-gray-400" />}
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto p-4 space-y-2">
                    {isLoading && users.length === 0 ? (
                        <div className="text-center text-gray-400 pt-10">Carregando...</div>
                    ) : (
                        users.map(user => <UserListItem key={user.id} user={user} onUserClick={onUserClick} />)
                    )}
                     {!isLoading && users.length === 0 && (
                        <div className="text-center text-gray-400 pt-10">Nenhum usuário encontrado.</div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default OnlineUsersModal;
