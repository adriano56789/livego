

import React from 'react';
import { User } from '../types';
import { UserIcon, StarIcon, BlockIcon } from './icons';

interface UserActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onViewProfile: (user: User) => void;
  onMention: (user: User) => void;
  onMakeModerator: (user: User) => void;
  onKick: (user: User) => void;
}

const UserActionModal: React.FC<UserActionModalProps> = ({ isOpen, onClose, user, onViewProfile, onMention, onMakeModerator, onKick }) => {
    if (!isOpen || !user) return null;

    const handleAction = (action: (user: User) => void) => {
        action(user);
        onClose();
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#1c1c1e] rounded-2xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
                <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-2 border-purple-500" />
                <h2 className="text-xl font-bold text-white">{user.name}</h2>
                <p className="text-sm text-gray-400 mb-6">Nível {user.level}</p>

                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleAction(onViewProfile)} className="bg-[#2c2c2e] hover:bg-gray-700/50 transition-colors p-3 rounded-lg flex flex-col items-center space-y-1">
                        <UserIcon className="w-6 h-6 text-gray-300" />
                        <span className="text-sm text-white">Ver Perfil</span>
                    </button>
                    <button onClick={() => handleAction(onMention)} className="bg-[#2c2c2e] hover:bg-gray-700/50 transition-colors p-3 rounded-lg flex flex-col items-center space-y-1">
                        <span className="text-2xl font-bold text-gray-300 h-6 flex items-center">@</span>
                        <span className="text-sm text-white">Mencionar</span>
                    </button>
                    <button onClick={() => handleAction(onMakeModerator)} className="bg-[#2c2c2e] hover:bg-gray-700/50 transition-colors p-3 rounded-lg flex flex-col items-center space-y-1">
                        <StarIcon className="w-6 h-6 text-gray-300" />
                        <span className="text-sm text-white">Tornar Mod</span>
                    </button>
                    <button onClick={() => handleAction(onKick)} className="bg-red-900/50 hover:bg-red-800/50 transition-colors p-3 rounded-lg flex flex-col items-center space-y-1">
                        <BlockIcon className="w-6 h-6 text-red-400" />
                        <span className="text-sm text-red-400">Expulsar</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserActionModal;