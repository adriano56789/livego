
import React from 'react';
import { User } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onViewProfile: (user: User) => void;
    onMention: (user: User) => void;
    onMakeModerator: (user: User) => void;
    onKick: (user: User) => void;
}

const UserActionModal: React.FC<Props> = ({ isOpen, onClose, user, onViewProfile, onMention, onMakeModerator, onKick }) => {
    if(!isOpen || !user) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-transparent" onClick={onClose}>
            <div className="bg-[#2C2C2E] p-4 rounded-xl w-[250px] space-y-2" onClick={e => e.stopPropagation()}>
                <p className="text-white text-center font-bold mb-4">{user.name}</p>
                <button onClick={() => onViewProfile(user)} className="w-full p-2 bg-white/10 text-white rounded">Ver Perfil</button>
                <button onClick={() => onMention(user)} className="w-full p-2 bg-white/10 text-white rounded">Mencionar</button>
                <button onClick={() => onMakeModerator(user)} className="w-full p-2 bg-white/10 text-white rounded">Tornar Moderador</button>
                <button onClick={() => onKick(user)} className="w-full p-2 bg-red-500/20 text-red-500 rounded">Expulsar</button>
            </div>
        </div>
    )
}

export default UserActionModal;
