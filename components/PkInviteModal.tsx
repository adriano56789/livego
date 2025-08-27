
import React, { useState, useEffect, useMemo } from 'react';
import type { User, PrivateLiveInviteSettings } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import SearchIcon from './icons/SearchIcon';
import ClockIcon from './icons/ClockIcon';
import SettingsIcon from './icons/SettingsIcon';
import CrossIcon from './icons/CrossIcon';
import BellSnoozeIcon from './icons/BellSnoozeIcon';
import ToggleSwitch from './ToggleSwitch';
import { useApiViewer } from './ApiContext';
import ViewersIcon from './icons/ViewersIcon';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';

interface PkInviteModalProps {
  user: User;
  onClose: () => void;
  onEnterFriendLive: (friend: User) => void;
  onSendInvite: (friend: User) => void;
}

const FriendRow: React.FC<{ 
    friend: User; 
    onEnter: () => void; 
    onInvite: () => void; 
}> = ({ friend, onEnter, onInvite }) => {
  const showEnterButton = friend.coHostHistory === 'Co-host com Você';

  return (
    <div className="flex items-center gap-4 py-2">
        <div className="w-14 h-14 rounded-full overflow-hidden shrink-0">
          {friend.avatar_url ? <img src={friend.avatar_url} alt={friend.nickname || ''} className="w-full h-full object-cover" /> : <UserPlaceholderIcon className="w-full h-full p-1 text-gray-500 bg-gray-700"/> }
        </div>
        <div className="flex-grow overflow-hidden">
            <p className="font-semibold text-white truncate">{friend.nickname}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                <ViewersIcon className="w-3 h-3"/>
                <span>{friend.followers.toLocaleString('pt-BR')}</span>
                <p className="truncate">{friend.coHostHistory}</p>
            </div>
        </div>
        {showEnterButton ? (
            <button onClick={onEnter} className="bg-gray-700 text-white font-semibold text-sm px-5 py-2 rounded-full hover:bg-gray-600 transition-colors shrink-0">
              Entrar
            </button>
        ) : (
            <button 
                onClick={onInvite} 
                className={`font-semibold text-sm px-5 py-2 rounded-full transition-colors shrink-0 bg-pink-600 text-white hover:bg-pink-700`}
            >
              Convidar
            </button>
        )}
    </div>
  );
};


const PkInviteModal: React.FC<PkInviteModalProps> = ({ user, onClose, onEnterFriendLive, onSendInvite }) => {
    const [friends, setFriends] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState<PrivateLiveInviteSettings | null>(null);
    const [query, setQuery] = useState('');
    const { showApiResponse } = useApiViewer();
    
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [friendsData, settingsData] = await Promise.all([
                    liveStreamService.getCoHostFriends(user.id),
                    liveStreamService.getPrivateLiveInviteSettings(user.id)
                ]);
                setFriends(friendsData);
                setSettings(settingsData);
            } catch (error) {
                console.error("Failed to fetch invite modal data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user.id]);

    const handleSettingChange = async (key: keyof Omit<PrivateLiveInviteSettings, 'userId'>, value: boolean) => {
        if (!settings) return;
        const oldSettings = { ...settings };
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        try {
            const updated = await liveStreamService.updatePrivateLiveInviteSettings(user.id, { [key]: value });
            showApiResponse(`PUT /api/users/${user.id}/private-live-invite-settings`, updated);
            setSettings(updated);
        } catch (error) {
            console.error("Failed to update settings", error);
            setSettings(oldSettings);
        }
    };
    
    const filteredFriends = useMemo(() => {
        if (!query.trim()) return friends;
        const lowerQuery = query.toLowerCase();
        return friends.filter(f => 
            f.nickname?.toLowerCase().includes(lowerQuery) || 
            f.name.toLowerCase().includes(lowerQuery)
        );
    }, [friends, query]);

  return (
    <div className="fixed inset-0 z-50 bg-transparent flex items-end" onClick={onClose}>
      <div
        className="bg-[#1C1F24] w-full h-[75vh] max-h-[600px] rounded-t-2xl flex flex-col text-white animate-slide-up-fast"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-700/50">
          <button onClick={onClose}><CrossIcon className="w-6 h-6 text-gray-400" /></button>
          <h2 className="font-bold text-lg">Co-host com criadores</h2>
          <div className="flex items-center gap-4">
              <SearchIcon className="w-6 h-6 text-gray-400"/>
              <ClockIcon className="w-6 h-6 text-gray-400"/>
              <SettingsIcon className="w-6 h-6 text-gray-400"/>
          </div>
        </header>

        <main className="flex-grow p-4 overflow-y-auto scrollbar-hide">
            <div className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg">
                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-600">
                    <BellSnoozeIcon className="w-4 h-4 text-gray-300"/>
                </div>
                <span className="flex-grow text-sm text-gray-300">Aceitar apenas convites de amigos.</span>
                <ToggleSwitch 
                    enabled={settings?.acceptOnlyFriendPkInvites ?? false}
                    onChange={(val) => handleSettingChange('acceptOnlyFriendPkInvites', val)}
                />
            </div>

            <div className="my-4 p-3 flex items-center justify-between bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10">
                        <img src="https://i.pravatar.cc/150?u=suggestion" alt="convites rápidos" className="w-full h-full rounded-full object-cover"/>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-[#1C1F24]">?</div>
                    </div>
                    <p className="font-semibold text-sm">Faça novos amigos com<br/>convites rápidos</p>
                </div>
                <button className="bg-pink-600 text-white font-semibold text-sm px-5 py-2 rounded-full hover:bg-pink-700">
                    Enviar
                </button>
            </div>

            <h3 className="font-semibold text-gray-400 my-4">Amigos ({friends.length})</h3>

            {isLoading ? (
                <div className="text-center text-gray-500 py-10">Carregando...</div>
            ) : filteredFriends.length > 0 ? (
                <div className="divide-y divide-gray-700/50">
                    {filteredFriends.map(friend => (
                        <FriendRow 
                            key={friend.id} 
                            friend={friend} 
                            onEnter={() => onEnterFriendLive(friend)} 
                            onInvite={() => onSendInvite(friend)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-500 py-10">Nenhum amigo online encontrado.</div>
            )}
        </main>
      </div>
    </div>
  );
};

export default PkInviteModal;
