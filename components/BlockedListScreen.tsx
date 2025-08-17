import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import BlockedIcon from './icons/BlockedIcon';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';

interface BlockedListScreenProps {
  currentUserId: number;
  onExit: () => void;
}

const BlockedUserRow: React.FC<{ user: User; onUnblock: (userId: number) => void; isUnblocking: boolean }> = ({ user, onUnblock, isUnblocking }) => (
    <div className="flex items-center p-3 bg-gray-800/50 rounded-lg">
        <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden shrink-0 mr-4">
             {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
            ) : (
                <UserPlaceholderIcon className="w-8 h-8 text-gray-400 m-2"/>
            )}
        </div>
        <div className="flex-grow">
            <p className="font-semibold text-white">{user.nickname || user.name}</p>
            <p className="text-sm text-gray-400">ID: {user.id}</p>
        </div>
        <button
            onClick={() => onUnblock(user.id)}
            disabled={isUnblocking}
            className="bg-gray-600 text-white font-semibold text-sm px-4 py-2 rounded-full hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
            {isUnblocking ? '...' : 'Desbloquear'}
        </button>
    </div>
);

const BlockedListScreen: React.FC<BlockedListScreenProps> = ({ currentUserId, onExit }) => {
    const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [unblockingId, setUnblockingId] = useState<number | null>(null);

    const fetchBlockedUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const users = await liveStreamService.getBlockedUsers(currentUserId);
            setBlockedUsers(users);
        } catch (error) {
            console.error("Failed to load blocked users:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUserId]);

    useEffect(() => {
        fetchBlockedUsers();
    }, [fetchBlockedUsers]);

    const handleUnblock = async (userId: number) => {
        setUnblockingId(userId);
        try {
            await liveStreamService.unblockUser(currentUserId, userId);
            // Refetch list after unblocking
            fetchBlockedUsers();
        } catch (error) {
            console.error(`Failed to unblock user ${userId}:`, error);
            alert('Falha ao desbloquear usuário.');
        } finally {
            setUnblockingId(null);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex-grow flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
            );
        }
        if (blockedUsers.length === 0) {
            return (
                <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500">
                    <BlockedIcon className="w-16 h-16 mb-4" />
                    <h2 className="text-xl font-semibold">Nenhum usuário bloqueado</h2>
                    <p className="max-w-xs mt-2">Você pode bloquear usuários no perfil deles ou em uma live.</p>
                </div>
            );
        }
        return (
            <div className="space-y-3">
                {blockedUsers.map(user => (
                    <BlockedUserRow 
                        key={user.id} 
                        user={user} 
                        onUnblock={handleUnblock}
                        isUnblocking={unblockingId === user.id}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
            <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-800">
                <button onClick={onExit}><ArrowLeftIcon className="w-6 h-6"/></button>
                <h1 className="font-bold text-lg">Lista de Bloqueio</h1>
                <div className="w-6 h-6"></div> {/* Spacer */}
            </header>
            <main className="flex-grow p-4 overflow-y-auto scrollbar-hide">
                {renderContent()}
            </main>
        </div>
    );
};

export default BlockedListScreen;