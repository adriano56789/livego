import React, { useState, useEffect } from 'react';
import { BackIcon, BlockIcon } from './icons';
import { useTranslation } from '../i18n';
import { User } from '../types';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';

interface BlockListScreenProps {
  onClose: () => void;
  onUnblockUser: (user: User) => Promise<void>;
  onViewProfile: (user: User) => void;
}

const UserItem: React.FC<{ user: User; onUnblock: () => void; onViewProfile: () => void; }> = ({ user, onUnblock, onViewProfile }) => {
    return (
        <div className="flex items-center justify-between p-4 hover:bg-gray-800/50">
            <div className="flex items-center space-x-4 cursor-pointer" onClick={onViewProfile}>
                <img src={user.avatarUrl} alt={user.name} className="w-14 h-14 rounded-full object-cover" />
                <div>
                    <h3 className="font-semibold text-white">{user.name}</h3>
                    <p className="text-sm text-gray-400">ID: {user.identification}</p>
                </div>
            </div>
            <button
                onClick={onUnblock}
                className="bg-gray-700 text-gray-300 text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-gray-600"
            >
                Desbloquear
            </button>
        </div>
    );
};

const BlockListScreen: React.FC<BlockListScreenProps> = ({ onClose, onUnblockUser, onViewProfile }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getBlockedUsers().then(data => {
        setUsers(data || []);
    }).catch(console.error).finally(() => {
        setIsLoading(false);
    });
  }, []);

  const handleUnblock = async (userToUnblock: User) => {
    await onUnblockUser(userToUnblock);
    setUsers(prev => prev.filter(u => u.id !== userToUnblock.id));
  };

  return (
    <div className="absolute inset-0 bg-black z-50 flex flex-col text-white font-sans">
      <header className="flex items-center p-4 flex-shrink-0 border-b border-gray-800">
        <button onClick={onClose} className="absolute z-10"><BackIcon className="w-6 h-6" /></button>
        <div className="flex-grow text-center"><h1 className="text-xl font-bold">{t('userLists.blockList.title')}</h1></div>
      </header>
      <main className="flex-grow overflow-y-auto no-scrollbar bg-[#111]">
        {isLoading ? (
            <div className="flex justify-center items-center h-full"><LoadingSpinner/></div>
        ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="w-24 h-24 flex items-center justify-center rounded-full bg-[#1c1c1e] mb-6">
                    <BlockIcon className="w-12 h-12 text-gray-500" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">{t('userLists.blockList.noUsers')}</h2>
                <p className="text-gray-400">{t('userLists.blockList.description')}</p>
            </div>
        ) : (
            <div>
                {users.map(user => (
                    <UserItem 
                        key={user.id} 
                        user={user} 
                        onUnblock={() => handleUnblock(user)}
                        onViewProfile={() => onViewProfile(user)}
                    />
                ))}
            </div>
        )}
      </main>
    </div>
  );
};

export default BlockListScreen;