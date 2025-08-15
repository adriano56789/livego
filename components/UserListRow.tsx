import React, { useState } from 'react';
import type { User } from '../types';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';

interface UserListRowProps {
    user: User;
    currentUser: User;
    onFollowToggle: (userId: number) => void;
    onUserClick: (userId: number) => void;
}

const UserListRow: React.FC<UserListRowProps> = ({ user, currentUser, onFollowToggle, onUserClick }) => {
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    const isFollowing = currentUser.following.includes(user.id);
    const isCurrentUser = currentUser.id === user.id;

    const handleFollow = async () => {
        setIsFollowLoading(true);
        try {
            await onFollowToggle(user.id);
        } catch (error) {
            console.error("Follow toggle failed in UserListRow:", error);
            alert(`Ocorreu um erro: ${error instanceof Error ? error.message : 'Tente novamente.'}`);
        } finally {
            setIsFollowLoading(false);
        }
    };

    return (
        <div className="flex items-center px-4 py-3">
            <button onClick={() => onUserClick(user.id)} className="flex items-center gap-4 flex-grow text-left">
                <div className="w-14 h-14 rounded-full bg-gray-700 overflow-hidden shrink-0">
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                        <UserPlaceholderIcon className="w-full h-full text-gray-500 p-1" />
                    )}
                </div>
                <div className="flex-grow overflow-hidden">
                    <p className="font-semibold text-white truncate">{user.nickname || user.name}</p>
                    <p className="text-sm text-gray-400">ID: {user.id}</p>
                </div>
            </button>
            {!isCurrentUser && (
                <button
                    onClick={handleFollow}
                    disabled={isFollowLoading}
                    className={`font-semibold text-sm px-5 py-2 rounded-full transition-colors shrink-0 disabled:opacity-50 disabled:cursor-wait ${
                        isFollowing ? 'bg-gray-600 text-gray-300' : 'bg-green-500 text-black'
                    }`}
                >
                    {isFollowLoading ? '...' : (isFollowing ? 'Seguindo' : 'Seguir')}
                </button>
            )}
        </div>
    );
};

export default UserListRow;