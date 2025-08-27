

import React, { useState, useEffect, useMemo } from 'react';
import type { User } from '../types';
import * as authService from '../services/authService';
import * as liveStreamService from '../services/liveStreamService';
import CrossIcon from './icons/CrossIcon';
import { useApiViewer } from './ApiContext';
import SearchIcon from './icons/SearchIcon';

interface InviteToPrivateLiveModalProps {
  streamerId: number;
  liveId: number;
  onClose: () => void;
  onInviteSent: (invitee: User) => void;
}

const InviteToPrivateLiveModal: React.FC<InviteToPrivateLiveModalProps> = ({ streamerId, liveId, onClose, onInviteSent }) => {
  const [following, setFollowing] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [invitedUserIds, setInvitedUserIds] = useState<Set<number>>(new Set());
  const [query, setQuery] = useState('');
  const { showApiResponse } = useApiViewer();

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

  const filteredFollowing = useMemo(() => {
    if (!query.trim()) return following;
    const lowerQuery = query.toLowerCase();
    return following.filter(user =>
        (user.nickname || user.name).toLowerCase().includes(lowerQuery) ||
        String(user.id).includes(lowerQuery)
    );
  }, [following, query]);

  const handleInviteToggle = async (userToInvite: User) => {
    const inviteeId = userToInvite.id;
    const isInviting = !invitedUserIds.has(inviteeId);

    // Optimistic UI update
    setInvitedUserIds(prev => {
      const newSet = new Set(prev);
      if (isInviting) {
        newSet.add(inviteeId);
      } else {
        newSet.delete(inviteeId);
      }
      return newSet;
    });

    try {
      if (isInviting) {
        const response = await liveStreamService.inviteUserToPrivateLive(liveId, inviteeId);
        showApiResponse(`POST /api/lives/${liveId}/invite`, { inviteeId, response });
        onInviteSent(userToInvite);
      } else {
        const response = await liveStreamService.cancelPrivateLiveInvite(liveId, inviteeId);
        showApiResponse(`POST /api/lives/${liveId}/cancel-invite`, { inviteeId, response });
      }
    } catch (error) {
      console.error("Failed to update invite status:", error);
      alert('Falha ao atualizar o status do convite.');
      // Revert UI on failure
      setInvitedUserIds(prev => {
        const newSet = new Set(prev);
        if (isInviting) {
          newSet.delete(inviteeId);
        } else {
          newSet.add(inviteeId);
        }
        return newSet;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-transparent flex items-end" onClick={onClose}>
      <div 
        className="bg-[#1C1F24] w-full h-[75vh] max-h-[600px] rounded-t-2xl flex flex-col animate-slide-up-fast"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="w-6 h-6"></div>
          <h2 className="text-lg font-bold">Convidar para Live Privada</h2>
          <button onClick={onClose}><CrossIcon className="w-6 h-6 text-gray-400" /></button>
        </header>

        <div className="p-4 shrink-0">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar por nome ou ID"
              className="w-full bg-[#2c2c2e] h-11 rounded-full pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
            />
          </div>
        </div>
        
        <main className="flex-grow overflow-y-auto px-4 pb-4 space-y-2">
          {isLoading ? ( 
            <div className="text-center text-gray-400 pt-10">Carregando...</div>
          ) : filteredFollowing.length > 0 ? (
            filteredFollowing.map(user => {
                const isInvited = invitedUserIds.has(user.id);
                return (
                    <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg w-full bg-white/5">
                        <img src={user.avatar_url || 'https://i.pravatar.cc/150?u=' + user.id} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                        <div className="flex-grow text-left overflow-hidden">
                          <p className="font-semibold text-white truncate">{user.nickname || user.name}</p>
                          <p className="text-xs text-gray-400">Nível {user.level}</p>
                        </div>
                        <button 
                          onClick={() => handleInviteToggle(user)}
                          className={`font-semibold text-sm px-5 py-2 rounded-full transition-colors ${
                              isInvited 
                              ? 'bg-red-600 text-white hover:bg-red-500' 
                              : 'bg-green-600 text-white hover:bg-green-500'
                          }`}
                        >
                          {isInvited ? 'Cancelar' : 'Convidar'}
                        </button>
                    </div>
                )
            })
          ) : (
            <div className="text-center text-gray-500 pt-20">Nenhum usuário encontrado.</div>
          )}
        </main>
      </div>
    </div>
  );
};

export default InviteToPrivateLiveModal;