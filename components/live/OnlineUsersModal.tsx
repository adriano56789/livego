import React from 'react';
import { CloseIcon, YellowDiamondIcon, PlusIcon, CheckIcon } from '../icons';
import { LevelBadge } from '../LevelBadge';
import { User } from '../../types';


interface OnlineUsersModalProps {
    onClose: () => void;
    streamId: string;
    users?: (User & { value: number })[];
    currentUser?: User;
    onFollow?: (user: User) => void;
}

const OnlineUsersModal: React.FC<OnlineUsersModalProps> = ({ onClose, users = [], currentUser, onFollow }) => {
    const isUserFollowed = (userId: string) => {
        return currentUser?.followingIds?.includes(userId);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-transparent" onClick={onClose}>
            <div className="w-full bg-[#18181b] rounded-t-3xl h-[60vh] flex flex-col animate-in slide-in-from-bottom duration-300 shadow-2xl border-t border-white/5" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 px-5 border-b border-white/5 bg-[#18181b] rounded-t-3xl">
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors"><CloseIcon className="w-5 h-5" /></button>
                    <h2 className="text-white text-[15px] font-bold tracking-wide">Público Ativo ({users.length})</h2>
                    <div className="w-5"></div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                    {users.length === 0 ? (
                        <div className="text-center text-gray-500 mt-10">
                            <p className="text-sm font-bold">Ninguém interagindo ainda.</p>
                            <p className="text-[10px] uppercase mt-1">Aparecem aqui quem envia presentes ou entra na sala</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5">
                            {users.map((user) => {
                                const isFemale = user.gender === 'female';
                                const contribution = user.value || 0;
                                const isFollowed = isUserFollowed(user.id);
                                const isMe = user.id === currentUser?.id;

                                return (
                                    <div key={user.id} className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2 duration-300">
                                        <div className="relative w-12 h-12 flex-shrink-0">
                                            <div className="w-full h-full rounded-full overflow-hidden bg-gray-800 border border-white/10">
                                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-white text-[13px] font-bold truncate leading-tight mr-2">{user.name}</span>
                                                
                                                <div className="flex items-center gap-2">
                                                    {contribution > 0 && (
                                                        <div className="flex items-center gap-1 bg-[#2C2C2E] px-2 py-0.5 rounded-full border border-yellow-500/30">
                                                            <span className="text-yellow-400 text-xs font-bold">{contribution.toLocaleString()}</span>
                                                            <YellowDiamondIcon className="w-3 h-3 text-yellow-400" />
                                                        </div>
                                                    )}
                                                    
                                                    {!isMe && onFollow && (
                                                        <button 
                                                            onClick={() => !isFollowed && onFollow(user)}
                                                            className={`p-1.5 rounded-full transition-all active:scale-90 ${isFollowed ? 'bg-white/5 text-gray-600 cursor-default' : 'bg-[#FE2C55] text-white shadow-lg shadow-pink-900/20'}`}
                                                        >
                                                            {isFollowed ? <CheckIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className={`flex items-center px-1.5 py-[1px] rounded-[4px] gap-0.5 min-w-[30px] justify-center h-[16px] ${isFemale ? 'bg-[#FF4D80]' : 'bg-[#3b82f6]'}`}>
                                                    <span className="text-[9px] font-bold text-white leading-none">{user.age || 18}</span>
                                                </div>
                                                <LevelBadge level={user.level} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnlineUsersModal;