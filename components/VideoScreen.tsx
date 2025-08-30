
import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import * as authService from '../services/authService';
import UserListRow from './UserListRow';
import SearchIcon from './icons/SearchIcon';

interface VideoScreenProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
  onViewProfile: (userId: number) => void;
  onFollowToggle: (userId: number) => Promise<void>;
  onNavigateToChat: (userId: number) => void;
}

const VideoScreen: React.FC<VideoScreenProps> = ({ currentUser, onUpdateUser, onViewProfile, onFollowToggle, onNavigateToChat }) => {
    const [following, setFollowing] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFollowing = useCallback(async () => {
        setIsLoading(true);
        try {
            const followingUsers = await authService.getFollowingUsers(currentUser.id);
            setFollowing(followingUsers);
        } catch (error) {
            console.error("Failed to fetch following users:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser.id]);

    useEffect(() => {
        fetchFollowing();
    }, [fetchFollowing]);

    const handleFollowToggleWrapper = async (userIdToToggle: number) => {
        await onFollowToggle(userIdToToggle);
        // Optimistically remove from list if unfollowing.
        setFollowing(prev => prev.filter(u => u.id !== userIdToToggle));
    };

    const renderContent = () => {
        if (isLoading) {
            return <div className="flex-grow flex items-center justify-center"><div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div></div>;
        }
        if (following.length === 0) {
            return <div className="flex-grow flex items-center justify-center text-gray-500 text-center p-4">Você ainda não está seguindo ninguém. Encontre amigos na guia Ao vivo!</div>;
        }
        return (
            <div className="divide-y divide-gray-800">
                {following.map(user => (
                    <UserListRow 
                        key={user.id} 
                        user={user} 
                        currentUser={currentUser}
                        onFollowToggle={handleFollowToggleWrapper}
                        onUserClick={onViewProfile}
                        onAvatarClick={onNavigateToChat}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="h-full w-full bg-[#191919] flex flex-col text-white font-sans">
             <header className="px-4 pt-4 pb-2 flex items-center justify-between shrink-0">
                <div className="w-8 h-8"></div> {/* Spacer */}
                <h1 className="font-semibold text-lg text-white">Amigos para você</h1>
                <button className="p-2 -m-2">
                    <SearchIcon className="w-6 h-6" />
                </button>
            </header>
            <main className="flex-grow flex flex-col overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
};

export default VideoScreen;
