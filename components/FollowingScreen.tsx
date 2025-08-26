
import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import * as authService from '../services/authService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import UserListRow from './UserListRow';

interface FollowingScreenProps {
  currentUser: User;
  viewedUserId: number;
  onExit?: () => void;
  onUpdateUser: (user: User) => void;
  onViewProfile: (userId: number) => void;
  onFollowToggle: (userId: number) => void;
  isEmbedded?: boolean;
}

const FollowingScreen: React.FC<FollowingScreenProps> = ({ currentUser, viewedUserId, onExit, onUpdateUser, onViewProfile, onFollowToggle, isEmbedded = false }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const followingUsers = await authService.getFollowingUsers(viewedUserId);
            setUsers(followingUsers);
        } catch (error) {
            console.error("Failed to fetch following users:", error);
        } finally {
            setIsLoading(false);
        }
    }, [viewedUserId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFollowToggleWrapper = (userIdToToggle: number) => {
      // We need to know if we are following *before* the optimistic update happens in the parent.
      const isCurrentlyFollowing = (currentUser.following || []).includes(userIdToToggle);

      // Call the main handler from App.tsx which handles API and global state
      onFollowToggle(userIdToToggle);

      // If this is the current user's own "following" list, and the action was an unfollow,
      // remove the user from the local state to update the list instantly without a refetch.
      if (currentUser.id === viewedUserId && isCurrentlyFollowing) {
          setUsers(prevUsers => prevUsers.filter(u => u.id !== userIdToToggle));
      }
    };


    const renderContent = () => {
        if (isLoading) {
            return <div className="flex-grow flex items-center justify-center pt-10"><div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div></div>;
        }
        if (users.length === 0) {
            return <div className="flex-grow flex items-center justify-center text-gray-500 pt-10">Não segue ninguém.</div>;
        }
        return (
            <div className="divide-y divide-gray-800">
                {users.map(user => (
                    <UserListRow 
                        key={user.id} 
                        user={user} 
                        currentUser={currentUser}
                        onFollowToggle={handleFollowToggleWrapper}
                        onUserClick={onViewProfile}
                    />
                ))}
            </div>
        );
    };

    if (isEmbedded) {
        return <div className="pt-2">{renderContent()}</div>;
    }

    return (
        <div className="h-screen w-full bg-[#1C1F24] text-white flex flex-col font-sans">
            <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-800 relative">
                <button onClick={onExit} className="p-2 -m-2"><ArrowLeftIcon className="w-6 h-6"/></button>
                <h1 className="font-bold text-lg absolute left-1/2 -translate-x-1/2">Seguindo</h1>
                <div className="w-6 h-6"></div>
            </header>
            <main className="flex-grow overflow-y-auto scrollbar-hide">
                {renderContent()}
            </main>
        </div>
    );
};

export default FollowingScreen;
