
import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import * as authService from '../services/authService';
import * as liveStreamService from '../services/liveStreamService';
import CrossIcon from './icons/CrossIcon';
import CheckIcon from './icons/CheckIcon';

interface InviteToPartyModalProps {
  streamerId: number;
  liveId: number;
  onClose: () => void;
}

const InviteToPartyModal: React.FC<InviteToPartyModalProps> = ({ streamerId, liveId, onClose }) => {
  const [following, setFollowing] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [invitedUserIds, setInvitedUserIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchFollowing = async () => {
      setIsLoading(true);
      try {
        const data = await authService.getFollowingUsers(streamerId);
        setFollowing(data);
      } catch (error) {
        console.error("Failed to fetch following users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFollowing();
  }, [streamerId]);

  const handleInvite = async (inviteeId: number) => {
    if (invitedUserIds.has(inviteeId)) return;

    setInvitedUserIds(prev => new Set(prev).add(inviteeId));
    try {
      await liveStreamService.inviteUserToPrivateLive(liveId, inviteeId);
    } catch (error) {
      console.error("Failed to send invite:", error);
      alert('Falha ao enviar convite.');
      setInvitedUserIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(inviteeId);
        return newSet;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={onClose}>
      <div 
        className="bg-[#1C1F24] w-full h-[60vh] max-h-[500px] rounded-t-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="w-6 h-6"></div>
          <h2 className="text-lg font-bold">Convidar para Live Privada</h2>
          <button onClick={onClose}><CrossIcon className="w-6 h-6 text-gray-400" /></button>
        </header>
        <main className="flex-grow overflow-y-auto p-4 space-y-2">
          {isLoading ? ( 
            <div className="text-center text-gray-400 pt-10">Carregando...</div>
          ) : following.length > 0 ? (
            following.map(user => {
                const isInvited = invitedUserIds.has(user.id);
                return (
                    <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg w-full bg-white/5">
                        <img src={user.avatar_url || 'https://i.pravatar.cc/150?u=' + user.id} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                        <div className="flex-grow text-left">
                        <p className="font-semibold text-white truncate">{user.nickname || user.name}</p>
                        <p className="text-xs text-gray-400">Nível {user.level}</p>
                        </div>
                        <button 
                          onClick={() => handleInvite(user.id)}
                          disabled={isInvited}
                          className={`font-semibold text-sm px-5 py-2 rounded-full transition-colors ${
                              isInvited 
                              ? 'bg-gray-600 text-gray-400 flex items-center gap-1.5' 
                              : 'bg-green-600 text-white hover:bg-green-500'
                          }`}
                        >
                          {isInvited ? <><CheckIcon className="w-4 h-4"/> Convidado</> : 'Convidar'}
                        </button>
                    </div>
                )
            })
          ) : (
            <div className="text-center text-gray-500 pt-20">Você não está seguindo ninguém para convidar.</div>
          )}
        </main>
      </div>
    </div>
  );
};

export default InviteToPartyModal;
