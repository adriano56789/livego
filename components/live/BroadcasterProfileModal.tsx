
import React from 'react';
import { User } from '../../types';

interface BroadcasterProfileModalProps {
    user: User;
    isSelf: boolean;
    onClose: () => void;
    onStartChat: (user: User) => void;
}

const BroadcasterProfileModal: React.FC<BroadcasterProfileModalProps> = ({ user, onClose, onStartChat }) => (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
        <div className="bg-[#1C1C1E] p-4 rounded-lg max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 rounded-full mx-auto" />
            <h2 className="text-center text-white font-bold text-xl mt-2">{user.name}</h2>
            <p className="text-center text-gray-400">Level {user.level}</p>
            <div className="mt-4 flex justify-center space-x-4">
                <button className="bg-gray-600 px-4 py-2 rounded">Follow</button>
                <button onClick={() => onStartChat(user)} className="bg-blue-600 px-4 py-2 rounded">Chat</button>
            </div>
        </div>
    </div>
);

export default BroadcasterProfileModal;
