
import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import * as authService from '../services/authService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import UserListRow from './UserListRow';

interface FriendRequestScreenProps {
  currentUser: User;
  onExit: () => void;
  onUpdateUser: (user: User) => void;
  onViewProfile: (userId: number) => void;
}

const FriendRequestScreen: React.FC<FriendRequestScreenProps> = ({ currentUser, onExit, onUpdateUser, onViewProfile }) => {
    const [requests, setRequests] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const requestUsers = await authService.getFriendRequests(currentUser.id);
            setRequests(requestUsers);
        } catch (error) {
            console.error("Failed to fetch friend requests:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [currentUser.id]);

    const handleFollowToggle = async (userIdToToggle: number) => {
      // In this screen, we are only following back.
      const updatedUser = await liveStreamService.followUser(currentUser.id, userIdToToggle);
      onUpdateUser(updatedUser);
      // Remove the user from the list optimistically
      setRequests(prev => prev.filter(u => u.id !== userIdToToggle));
    };

    const renderContent = () => {
        if (isLoading) {
            return <div className="flex-grow flex items-center justify-center"><div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div></div>;
        }
        if (requests.length === 0) {
            return <div className="flex-grow flex items-center justify-center text-gray-500">Nenhum pedido de amizade.</div>;
        }
        return (
            <div className="divide-y divide-gray-800">
                {requests.map(user => (
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
            <header className="p-4 flex items-center shrink-0 border-b border-gray-800 relative">
                <button onClick={onExit} className="p-2 -m-2 z-10"><ArrowLeftIcon className="w-6 h-6"/></button>
                <h1 className="font-bold text-lg absolute left-1/2 -translate-x-1/2">Pedidos de Amizade</h1>
                <div className="w-6 h-6"></div>
            </header>
            <main className="flex-grow overflow-y-auto scrollbar-hide">
                {renderContent()}
            </main>
        </div>
    );
};

export default FriendRequestScreen;
