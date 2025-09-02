
import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import * as authService from '../services/authService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import UserListRow from './UserListRow';

interface VisitorsScreenProps {
  currentUser: User;
  viewedUserId: number;
  onExit: () => void;
  onUpdateUser: (user: User) => void;
  onViewProfile: (userId: number) => void;
  onFollowToggle: (userId: number) => void;
  onNavigateToChat: (userId: number) => void;
}

const VisitorsScreen: React.FC<VisitorsScreenProps> = ({ currentUser, viewedUserId, onExit, onUpdateUser, onViewProfile, onFollowToggle, onNavigateToChat }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async (isInitialLoad = false) => {
        if (isInitialLoad) {
            setIsLoading(true);
        }
        try {
            const visitorUsers = await authService.getProfileVisitors(viewedUserId);
            setUsers(visitorUsers);
        } catch (error) {
            console.error("Failed to fetch visitors:", error);
        } finally {
            if (isInitialLoad) {
                setIsLoading(false);
            }
        }
    }, [viewedUserId]);

    useEffect(() => {
        fetchData(true);
        const interval = setInterval(() => fetchData(false), 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleFollowToggleWrapper = (userIdToToggle: number) => {
      onFollowToggle(userIdToToggle);
    };

    const renderContent = () => {
        if (isLoading && users.length === 0) {
            return <div className="flex-grow flex items-center justify-center"><div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div></div>;
        }
        if (users.length === 0) {
            return <div className="flex-grow flex items-center justify-center text-gray-500">Ninguém visitou este perfil recentemente.</div>;
        }
        return (
            <div className="divide-y divide-gray-800">
                {users.slice(0, 20).map(user => ( // Limit to 20 most recent
                    <UserListRow 
                        key={user.id} 
                        user={user} 
                        currentUser={currentUser}
                        onFollowToggle={handleFollowToggleWrapper}
                        onUserClick={onViewProfile}
                        onAvatarClick={onNavigateToChat}
                        visitDate={user.last_visit_date}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="h-screen w-full bg-[#1C1F24] text-white flex flex-col font-sans">
            <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-800 relative">
                <button onClick={onExit} className="p-2 -m-2"><ArrowLeftIcon className="w-6 h-6"/></button>
                <h1 className="font-bold text-lg absolute left-1/2 -translate-x-1/2 whitespace-nowrap">Visitantes ({users.length})</h1>
                <div className="w-6 h-6"></div>
            </header>
            <main className="flex-grow overflow-y-auto scrollbar-hide">
                {renderContent()}
            </main>
        </div>
    );
};

export default VisitorsScreen;
