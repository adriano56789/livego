import React, { useState } from 'react';
import type { User } from '../types';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';

interface UserListRowProps {
    user: User;
    currentUser: User;
    onFollowToggle: (userId: number) => void;
    onDeclineRequest?: (userId: number) => void;
    onUserClick: (userId: number) => void;
    onAvatarClick?: (userId: number) => void;
    visitDate?: string;
    actionType?: 'follow' | 'friend_request';
}

const formatVisitDate = (dateString?: string): string | null => {
    if (!dateString) return null;
    const visitDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (visitDate.getFullYear() === today.getFullYear() &&
        visitDate.getMonth() === today.getMonth() &&
        visitDate.getDate() === today.getDate()) {
        return 'Hoje';
    }

    if (visitDate.getFullYear() === yesterday.getFullYear() &&
        visitDate.getMonth() === yesterday.getMonth() &&
        visitDate.getDate() === yesterday.getDate()) {
        return 'Ontem';
    }
    
    return visitDate.toLocaleDateString('pt-BR');
};


const UserListRow: React.FC<UserListRowProps> = ({ user, currentUser, onFollowToggle, onDeclineRequest, onUserClick, onAvatarClick, visitDate, actionType = 'follow' }) => {
    const [isLoading, setIsLoading] = useState(false);
    const isFollowing = (currentUser.following || []).includes(user.id);
    const isCurrentUser = currentUser.id === user.id;

    const handleAction = async (action: (userId: number) => void) => {
        setIsLoading(true);
        try {
            await action(user.id);
        } catch (error) {
            console.error("Action failed in UserListRow:", error);
            alert(`Ocorreu um erro: ${error instanceof Error ? error.message : 'Tente novamente.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarClick = () => {
        if (onAvatarClick) {
            onAvatarClick(user.id);
        } else {
            onUserClick(user.id);
        }
    };
    
    const formattedDate = formatVisitDate(visitDate);

    const renderButtons = () => {
        if (isCurrentUser) return null;

        if (actionType === 'friend_request' && onDeclineRequest) {
            return (
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => handleAction(onDeclineRequest)}
                        disabled={isLoading}
                        className="font-semibold text-sm px-5 py-2 rounded-full transition-colors bg-gray-600 text-gray-300 hover:bg-gray-500 disabled:opacity-50"
                    >
                        Recusar
                    </button>
                    <button
                        onClick={() => handleAction(onFollowToggle)}
                        disabled={isLoading}
                        className="font-semibold text-sm px-5 py-2 rounded-full transition-colors bg-green-500 text-black hover:bg-green-400 disabled:opacity-50"
                    >
                        Aceitar
                    </button>
                </div>
            );
        }

        return (
            <button
                onClick={() => handleAction(onFollowToggle)}
                disabled={isLoading}
                className={`font-semibold text-sm px-5 py-2 rounded-full transition-colors shrink-0 disabled:opacity-50 disabled:cursor-wait ${
                    isFollowing ? 'bg-gray-600 text-gray-300' : 'bg-green-500 text-black'
                }`}
            >
                {isLoading ? '...' : (isFollowing ? 'Seguindo' : 'Seguir')}
            </button>
        );
    };

    return (
        <div className="flex items-center px-4 py-3">
            <div className="flex items-center gap-4 flex-grow">
                <button onClick={handleAvatarClick} className="w-14 h-14 rounded-full bg-gray-700 overflow-hidden shrink-0">
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                        <UserPlaceholderIcon className="w-full h-full text-gray-500 p-1" />
                    )}
                </button>
                <button onClick={() => onUserClick(user.id)} className="flex-grow text-left overflow-hidden">
                    <p className="font-semibold text-white truncate">{user.nickname || user.name}</p>
                     {formattedDate ? (
                        <p className="text-sm text-gray-400">Visitou: {formattedDate}</p>
                    ) : (
                        <p className="text-sm text-gray-400">ID: {user.id}</p>
                    )}
                </button>
            </div>
            {renderButtons()}
        </div>
    );
};

export default UserListRow;