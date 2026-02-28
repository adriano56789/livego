
import React from 'react';
import { CloseIcon, UserIcon } from '../icons';

interface LiveHeaderProps {
    user: {
        name: string;
        avatar: string;
        secondaryText?: string;
    };
    onlineCount: number;
    onClose: () => void;
    onProfileClick: () => void;
    onOnlineUsersClick: () => void;
}

const LiveHeader: React.FC<LiveHeaderProps> = ({ user, onlineCount, onClose, onProfileClick, onOnlineUsersClick }) => (
    <header className="p-3 bg-transparent flex justify-between items-center absolute top-0 left-0 right-0 z-20">
        <div className="flex items-center space-x-2">
            <button onClick={onProfileClick} className="flex items-center bg-black/40 rounded-full p-1 pr-3">
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover mr-2" />
                <div>
                    <p className="text-white font-bold text-sm">{user.name}</p>
                    {user.secondaryText && <p className="text-gray-300 text-xs">{user.secondaryText}</p>}
                </div>
            </button>
            <button onClick={onOnlineUsersClick} className="flex items-center bg-black/40 rounded-full p-2">
                <UserIcon className="w-4 h-4 text-white" />
                <span className="text-white text-sm ml-1">{onlineCount}</span>
            </button>
        </div>
        <button onClick={onClose} className="w-8 h-8 bg-black/40 rounded-full flex items-center justify-center">
            <CloseIcon className="w-5 h-5 text-white" />
        </button>
    </header>
);

export default LiveHeader;
