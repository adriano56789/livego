import React from 'react';
import { User } from '../../types';
import { BackIcon, FanBadgeIcon } from '../icons';

interface FanClubMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamer: User;
  members: User[];
  onViewProfile: (user: User) => void;
}

const MemberItem: React.FC<{ user: User; onViewProfile: (user: User) => void; streamerName: string }> = ({ user, onViewProfile, streamerName }) => {
    return (
        <div 
            className="flex items-center justify-between p-4 hover:bg-gray-800/50 cursor-pointer"
            onClick={() => onViewProfile(user)}
        >
            <div className="flex items-center space-x-4">
                <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" />
                <div>
                    <h3 className="font-semibold text-white">{user.name}</h3>
                    <p className="text-sm text-gray-400">ID: {user.identification}</p>
                </div>
            </div>
            {user.fanClub && (
                <FanBadgeIcon level={user.fanClub.level} streamerName={streamerName} />
            )}
        </div>
    );
};


const FanClubMembersModal: React.FC<FanClubMembersModalProps> = ({ isOpen, onClose, streamer, members, onViewProfile }) => {
  if (!isOpen) return null;

  return (
    <div 
        className={`absolute inset-0 z-[60] flex items-end justify-center bg-black/60`}
        onClick={onClose}
    >
        <div 
            className="bg-[#1C1C1E] w-full max-w-md h-[70%] rounded-t-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
        >
            <header className="flex items-center p-4 border-b border-gray-700 flex-shrink-0">
                <button onClick={onClose} className="absolute p-2 -ml-2">
                    <BackIcon className="w-6 h-6" />
                </button>
                <div className="flex-grow text-center">
                    <h1 className="text-lg font-semibold">Membros do Fã-clube ({members.length})</h1>
                </div>
            </header>
            <main className="flex-grow overflow-y-auto no-scrollbar">
                {members.length > 0 ? (
                    members.map(member => (
                        <MemberItem 
                            key={member.id} 
                            user={member} 
                            onViewProfile={onViewProfile} 
                            streamerName={streamer.name} 
                        />
                    ))
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>Nenhum membro no fã-clube ainda.</p>
                    </div>
                )}
            </main>
        </div>
    </div>
  );
};

export default FanClubMembersModal;