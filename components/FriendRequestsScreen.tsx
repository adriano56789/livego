import React from 'react';
import { User } from '../types';
import { BackIcon, BrazilFlagIcon, MaleIcon, FemaleIcon, RankIcon } from './icons';
import { useTranslation } from '../i18n';

// Badges as seen in the screenshot
const AgeBadge: React.FC<{ user: User }> = ({ user }) => (
    <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 ${user.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'}`}>
        {user.gender === 'male' ? <MaleIcon className="h-3 w-3" /> : <FemaleIcon className="h-3 w-3" />}
        <span>{user.age}</span>
    </span>
);

const LevelBadge: React.FC<{ level: number }> = ({ level }) => (
    <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
        <RankIcon className="h-3 w-3" />
        <span>{level}</span>
    </span>
);

const UserItem: React.FC<{ user: User; onClick: () => void; onFollow: (user: User) => void; }> = ({ user, onClick, onFollow }) => {
    const { t } = useTranslation();
    
    // Placeholder date as it's not in the model
    const date = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    return (
        <div className="flex items-center justify-between p-4 border-b border-gray-800" onClick={onClick}>
            <div className="flex items-center space-x-4 cursor-pointer">
                <div className="relative">
                    <img src={user.avatarUrl} alt={user.name} className="w-14 h-14 rounded-full object-cover" />
                    <div className="absolute -bottom-1 -right-1">
                        <BrazilFlagIcon className="w-5 h-5 rounded-full" />
                    </div>
                </div>
                <div className="flex flex-col space-y-1">
                    <h3 className="font-semibold text-white">{user.name}</h3>
                    <div className="flex items-center space-x-1.5">
                        {user.age && <AgeBadge user={user} />}
                        <LevelBadge level={user.level} />
                    </div>
                </div>
            </div>
            <div className="flex items-center space-x-4">
                 <span className="text-sm text-gray-500">{formattedDate}</span>
                <button
                    onClick={(e) => { e.stopPropagation(); onFollow(user); }}
                    className="text-sm font-semibold px-4 py-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600"
                >
                   {t('common.following')}
                </button>
            </div>
        </div>
    );
};


interface FriendRequestsScreenProps {
  onBack: () => void;
  onViewProfile: (user: User) => void;
  users: User[];
  onFollowUser: (user: User) => void;
}

const FriendRequestsScreen: React.FC<FriendRequestsScreenProps> = ({ onBack, onViewProfile, users, onFollowUser }) => {
    const { t } = useTranslation();
    return (
        <div className="absolute inset-0 bg-[#111] z-50 flex flex-col text-white">
            <header className="flex items-center p-4 border-b border-gray-800 flex-shrink-0">
                <button onClick={onBack} className="absolute">
                    <BackIcon className="w-6 h-6" />
                </button>
                <div className="flex-grow text-center">
                    <h1 className="text-lg font-semibold">Pedido de amizade</h1>
                </div>
                <div className="w-6"/> {/* Spacer */}
            </header>
            <main className="flex-grow overflow-y-auto no-scrollbar">
                {users.length > 0 ? (
                    users.map(user => <UserItem key={user.id} user={user} onClick={() => onViewProfile(user)} onFollow={onFollowUser} />)
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>Nenhum pedido de amizade enviado.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default FriendRequestsScreen;