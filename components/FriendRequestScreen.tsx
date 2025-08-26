import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import * as authService from '../services/authService';
import * as liveStreamService from '../services/liveStreamService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import UserPlusIcon from './icons/UserPlusIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import MaleIcon from './icons/MaleIcon';
import Flag from './Flag';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';

interface FriendRequestScreenProps {
  currentUser: User;
  onExit: () => void;
  onUpdateUser: (user: User) => void;
  onViewProfile: (userId: number) => void;
}

const formatTimestamp = (isoString?: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 2) return "2 Minutos atrás"; // Matching screenshot
  if (diffMinutes < 60) return `${diffMinutes} Minutos atrás`;
  
  const daysOfWeek = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  if (diffDays < 7) {
    return daysOfWeek[date.getDay()];
  }

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const RequestRow: React.FC<{ user: User; onAccept: (userId: number) => void; onViewProfile: (userId: number) => void; }> = ({ user, onAccept, onViewProfile }) => {
    const [isLoading, setIsLoading] = useState(false);
    
    const handleAccept = async () => {
        setIsLoading(true);
        await onAccept(user.id);
        // The component will be unmounted by the parent, so no need to setIsLoading(false)
    };

    return (
        <div className="flex items-center gap-4 py-3">
            <button onClick={() => onViewProfile(user.id)} className="relative shrink-0">
                <div className="w-16 h-16 rounded-full bg-gray-700 overflow-hidden">
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.nickname || user.name} className="w-full h-full object-cover" />
                    ) : (
                        <UserPlaceholderIcon className="w-full h-full p-2 text-gray-500"/>
                    )}
                </div>
                {user.country && <Flag code={user.country} className="absolute bottom-0 right-0 w-5 h-auto rounded-sm border border-black" />}
                {user.online_status && <div className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-black" />}
            </button>

            <div className="flex-grow overflow-hidden" onClick={() => onViewProfile(user.id)}>
                <p className="font-bold text-white truncate">{user.nickname}</p>
                <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-1 bg-pink-500/20 text-pink-300 px-2 py-1 rounded-full text-xs font-semibold">
                        <MaleIcon className="w-3 h-3" />
                        <span>{user.level}</span>
                    </div>
                     <div className="flex items-center gap-1 bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full text-xs font-semibold">
                        <ChevronDownIcon className="w-3 h-3" />
                        <span>{user.level2 || 1}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end shrink-0">
                <p className="text-xs text-gray-400 mb-2">{formatTimestamp(user.followTimestamp)}</p>
                <button onClick={handleAccept} disabled={isLoading} className="w-10 h-10 flex items-center justify-center bg-blue-500/20 rounded-full hover:bg-blue-500/40 transition-colors">
                    <UserPlusIcon className="w-6 h-6 text-blue-300" />
                </button>
            </div>
        </div>
    );
};


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

    const handleAcceptRequest = async (userIdToAccept: number) => {
      const updatedUser = await liveStreamService.followUser(currentUser.id, userIdToAccept);
      onUpdateUser(updatedUser);
      setRequests(prev => prev.filter(u => u.id !== userIdToAccept));
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
                    <RequestRow 
                        key={user.id} 
                        user={user} 
                        onAccept={handleAcceptRequest}
                        onViewProfile={onViewProfile}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="h-screen w-full bg-[#121212] text-white flex flex-col font-sans">
            <header className="p-4 flex items-center shrink-0 border-b border-gray-800 relative">
                <button onClick={onExit} className="p-2 -m-2 z-10"><ArrowLeftIcon className="w-6 h-6"/></button>
                <h1 className="font-bold text-lg absolute left-1/2 -translate-x-1/2">Pedido de amizade</h1>
                <div className="w-6 h-6"></div>
            </header>
            <main className="flex-grow overflow-y-auto scrollbar-hide px-4">
                {renderContent()}
            </main>
        </div>
    );
};

export default FriendRequestScreen;
