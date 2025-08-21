
import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import * as authService from '../services/authService';
import * as liveStreamService from '../services/liveStreamService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import UserListRow from './UserListRow';

interface FansScreenProps {
  currentUser: User;
  viewedUserId: number;
  onExit: () => void;
  onUpdateUser: (user: User) => void;
  onViewProfile: (userId: number) => void;
}

const FansScreen: React.FC<FansScreenProps> = ({ currentUser, viewedUserId, onExit, onUpdateUser, onViewProfile }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Use the new getFans service function
                const fanUsers = await authService.getFans(viewedUserId);
                setUsers(fanUsers);
            } catch (error) {
                console.error("Failed to fetch fans:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [viewedUserId]);

    const handleFollowToggle = async (userIdToToggle: number) => {
      const isCurrentlyFollowing = currentUser.following.includes(userIdToToggle);
      const updatedUser = isCurrentlyFollowing
        ? await liveStreamService.unfollowUser(currentUser.id, userIdToToggle)
        : await liveStreamService.followUser(currentUser.id, userIdToToggle);
      onUpdateUser(updatedUser);
    };

    const renderContent = () => {
        if (isLoading) {
            return <div className="flex-grow flex items-center justify-center"><div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div></div>;
        }
        if (users.length === 0) {
            return <div className="flex-grow flex items-center justify-center text-gray-500">Nenhum fã encontrado.</div>;
        }
        return (
            <div className="divide-y divide-gray-800">
                {users.map(user => (
                    <UserListRow 
                        key={user.id} 
                        user={user} 
                        currentUser={currentUser}
                        onFollowToggle={handleFollowToggle}
                        onUserClick={onViewProfile}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="h-screen w-full bg-[#1C1F24] text-white flex flex-col font-sans">
            <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-800 relative">
                <button onClick={onExit} className="p-2 -m-2"><ArrowLeftIcon className="w-6 h-6"/></button>
                <h1 className="font-bold text-lg absolute left-1/2 -translate-x-1/2">Fãs</h1>
                <div className="w-6 h-6"></div>
            </header>
            <main className="flex-grow overflow-y-auto scrollbar-hide">
                {renderContent()}
            </main>
        </div>
    );
};

export default FansScreen;
