
import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import * as authService from '../services/authService';
import * as liveStreamService from '../services/liveStreamService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ToggleSwitch from './ToggleSwitch';
import FemaleIcon from './icons/FemaleIcon';

interface PushSettingsScreenProps {
    user: User;
    onExit: () => void;
}

const UserAvatar: React.FC<{ user: User }> = ({ user }) => {
    if (user.avatar_url) {
        return <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />;
    }
    
    let initials: string;
    let color: string;

    const name = user.nickname || user.name;
    initials = name.substring(0, 1).toUpperCase();
    const colors = ['bg-green-500', 'bg-blue-500', 'bg-pink-500', 'bg-red-500', 'bg-teal-500', 'bg-purple-500'];
    color = colors[user.id % colors.length];

    return (
        <div className={`w-full h-full flex items-center justify-center ${color}`}>
            <span className="text-white font-bold text-2xl">{initials}</span>
        </div>
    );
}

const UserRow: React.FC<{ user: User; enabled: boolean; onToggle: (enabled: boolean) => void; }> = ({ user, enabled, onToggle }) => {
    return (
        <div className="px-4 py-3 flex items-center">
            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 mr-4">
                <UserAvatar user={user} />
            </div>
            <div className="flex-grow">
                <p className="font-semibold text-white">{user.nickname || user.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                    {user.age && user.gender && (
                         <span className={`text-xs px-2 py-0.5 rounded-md font-bold text-white flex items-center gap-1 ${user.gender === 'female' ? 'bg-pink-400' : 'bg-blue-400'}`}>
                             {user.gender === 'female' ? <FemaleIcon className="w-2.5 h-2.5" /> : null}
                             {user.age}
                         </span>
                    )}
                    <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-md font-bold">Lv.{user.level}</span>
                </div>
            </div>
            <ToggleSwitch enabled={enabled} onChange={onToggle} ariaLabel={`Notificações para ${user.name}`} />
        </div>
    );
};

const PushSettingsScreen: React.FC<{ user: User; onExit: () => void; }> = ({ user, onExit }) => {
    const [followingUsers, setFollowingUsers] = useState<User[]>([]);
    const [pushSettings, setPushSettings] = useState<Record<number, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [users, settings] = await Promise.all([
                    authService.getFollowingUsers(user.id),
                    liveStreamService.getPushSettings(user.id)
                ]);
                setFollowingUsers(users);
                
                const initialSettings: Record<number, boolean> = {};
                users.forEach(u => {
                    initialSettings[u.id] = settings[u.id] ?? true;
                });
                setPushSettings(initialSettings);

            } catch (error) {
                console.error("Failed to fetch push settings data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user.id]);

    const handleToggleChange = async (followedUserId: number, enabled: boolean) => {
        const oldSettings = { ...pushSettings };
        setPushSettings(prev => ({ ...prev, [followedUserId]: enabled }));

        try {
            await liveStreamService.updatePushSetting(user.id, followedUserId, enabled);
        } catch (error) {
            console.error("Failed to update push setting:", error);
            setPushSettings(oldSettings);
            alert('Falha ao salvar a configuração.');
        }
    };

    return (
        <div className="h-screen w-full bg-[#1c1c1c] text-white flex flex-col font-sans">
            <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-700/50 relative">
                <button onClick={onExit} className="p-2 -m-2 z-10">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="font-semibold text-lg absolute left-1/2 -translate-x-1/2 whitespace-nowrap">Iniciar configurações de push</h1>
                <div className="w-6 h-6"></div>
            </header>
            <main className="flex-grow overflow-y-auto">
                {isLoading ? (
                    <div className="text-center text-gray-400 pt-10">Carregando...</div>
                ) : (
                    <div className="divide-y divide-gray-700/50">
                        {followingUsers.map(u => (
                            <UserRow 
                                key={u.id} 
                                user={u}
                                enabled={pushSettings[u.id] ?? true}
                                onToggle={(enabled) => handleToggleChange(u.id, enabled)}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default PushSettingsScreen;
