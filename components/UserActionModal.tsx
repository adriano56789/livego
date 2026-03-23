import React from 'react';
import { User } from '../types';
import { UserIcon, StarIcon, BlockIcon, ShieldIcon } from './icons';
import AvatarWithFrame from './ui/AvatarWithFrame';

interface UserActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  currentUser: User | null;
  streamer: User | null;
  onViewProfile: (user: User) => void;
  onMention: (user: User) => void;
  onMakeModerator: (user: User) => void;
  onKick: (user: User) => void;
}

const UserActionModal: React.FC<UserActionModalProps> = ({ 
    isOpen, 
    onClose, 
    user, 
    currentUser, 
    streamer,
    onViewProfile, 
    onMention, 
    onMakeModerator, 
    onKick 
}) => {
    if (!isOpen || !user) return null;

    // ID DO DONO DO APLICATIVO - PROTEÇÃO MÁXIMA
    const APP_OWNER_ID = '65384127';
    
    // VERIFICAÇÕES DE PROTEÇÃO
    const isAppOwner = user.id === APP_OWNER_ID;
    const isCurrentUserOwner = currentUser?.id === APP_OWNER_ID;
    const isStreamer = user.id === streamer?.id;
    const isCurrentUserStreamer = currentUser?.id === streamer?.id;
    
    // REGRAS DE PROTEÇÃO
    const canKick = !isAppOwner && !isStreamer && (isCurrentUserOwner || isCurrentUserStreamer);
    const canMakeModerator = !isAppOwner && (isCurrentUserOwner || isCurrentUserStreamer);

    const handleAction = (action: (user: User) => void) => {
        action(user);
        onClose();
    };

    const getKickButtonContent = () => {
        if (isAppOwner) {
            return {
                icon: <ShieldIcon className="w-6 h-6 text-yellow-400" />,
                text: "Protegido",
                bgColor: "bg-yellow-900/50",
                hoverColor: "hover:bg-yellow-800/50",
                textColor: "text-yellow-400",
                disabled: true,
                title: "Dono do aplicativo - não pode ser expulso"
            };
        }
        
        if (isStreamer) {
            return {
                icon: <ShieldIcon className="w-6 h-6 text-blue-400" />,
                text: "Host",
                bgColor: "bg-blue-900/50", 
                hoverColor: "hover:bg-blue-800/50",
                textColor: "text-blue-400",
                disabled: true,
                title: "Host da transmissão - não pode ser expulso"
            };
        }

        return {
            icon: <BlockIcon className="w-6 h-6 text-red-400" />,
            text: "Expulsar",
            bgColor: "bg-red-900/50",
            hoverColor: "hover:bg-red-800/50", 
            textColor: "text-red-400",
            disabled: false,
            title: "Expulsar usuário da transmissão"
        };
    };

    const kickButton = getKickButtonContent();

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#1c1c1e] rounded-2xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
                <AvatarWithFrame 
                    user={user} 
                    size="xl" 
                    className="w-20 h-20 mx-auto mb-4"
                />
                <h2 className="text-xl font-bold text-white">{user.name}</h2>
                <p className="text-sm text-gray-400 mb-6">
                    Nível {user.level}
                    {isAppOwner && <span className="ml-2 text-yellow-400">👑 Dono</span>}
                    {isStreamer && !isAppOwner && <span className="ml-2 text-blue-400">🎥 Host</span>}
                </p>

                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleAction(onViewProfile)} className="bg-[#2c2c2e] hover:bg-gray-700/50 transition-colors p-3 rounded-lg flex flex-col items-center space-y-1">
                        <UserIcon className="w-6 h-6 text-gray-300" />
                        <span className="text-sm text-white">Ver Perfil</span>
                    </button>
                    <button onClick={() => handleAction(onMention)} className="bg-[#2c2c2e] hover:bg-gray-700/50 transition-colors p-3 rounded-lg flex flex-col items-center space-y-1">
                        <span className="text-2xl font-bold text-gray-300 h-6 flex items-center">@</span>
                        <span className="text-sm text-white">Mencionar</span>
                    </button>
                    {canMakeModerator && (
                        <button onClick={() => handleAction(onMakeModerator)} className="bg-[#2c2c2e] hover:bg-gray-700/50 transition-colors p-3 rounded-lg flex flex-col items-center space-y-1">
                            <StarIcon className="w-6 h-6 text-gray-300" />
                            <span className="text-sm text-white">Tornar Mod</span>
                        </button>
                    )}
                    <button 
                        onClick={() => canKick && handleAction(onKick)} 
                        className={`${kickButton.bgColor} ${kickButton.disabled ? '' : kickButton.hoverColor} transition-colors p-3 rounded-lg flex flex-col items-center space-y-1 ${kickButton.disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                        disabled={kickButton.disabled}
                        title={kickButton.title}
                    >
                        {kickButton.icon}
                        <span className={`text-sm ${kickButton.textColor}`}>{kickButton.text}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserActionModal;