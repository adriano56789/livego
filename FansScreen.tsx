import React from 'react';
import { User } from '../types';
import { BackIcon } from './icons';
import { useTranslation } from '../i18n';

interface FansScreenProps {
  onBack: () => void;
  onViewProfile: (user: User) => void;
  users: User[];
  onFollowUser: (user: User) => void;
}

const UserItem: React.FC<{ user: User; onClick: () => void; onFollow: (user: User) => void; }> = ({ user, onClick, onFollow }) => {
    const { t } = useTranslation();
    return (
        <div className="flex items-center justify-between p-4 hover:bg-gray-800/50 cursor-pointer" onClick={onClick}>
            <div className="flex items-center space-x-4">
                <img src={user.avatarUrl} alt={user.name} className="w-14 h-14 rounded-full object-cover" />
                <div>
                    <h3 className="font-semibold text-white">{user.name}</h3>
                    <p className="text-sm text-gray-400">{t('profile.id')}: {user.identification}</p>
                </div>
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); onFollow(user); }}
                className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-colors ${user.isFollowed ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
                {user.isFollowed ? t('common.following') : t('common.follow')}
            </button>
        </div>
    );
};


const FansScreen: React.FC<FansScreenProps> = ({ onBack, onViewProfile, users, onFollowUser }) => {
    const { t } = useTranslation();
    return (
        <div className="absolute inset-0 bg-[#111] z-50 flex flex-col text-white">
            <header className="flex items-center p-4 border-b border-gray-800 flex-shrink-0">
                <button onClick={onBack} className="absolute">
                    <BackIcon className="w-6 h-6" />
                </button>
                <div className="flex-grow text-center">
                    <h1 className="text-lg font-semibold">{t('userLists.fans.title')}</h1>
                </div>
            </header>
            <main className="flex-grow overflow-y-auto no-scrollbar">
                {users.length > 0 ? (
                    users.map(user => <UserItem key={user.id} user={user} onClick={() => onViewProfile(user)} onFollow={onFollowUser} />)
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>{t('userLists.fans.noUsers')}</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default FansScreen;