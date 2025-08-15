import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import CrossIcon from './icons/CrossIcon';

interface SelectOpponentModalProps {
  currentUserId: number;
  onClose: () => void;
  onInvite: (inviteeId: number) => void;
}

const SelectOpponentModal: React.FC<SelectOpponentModalProps> = ({ currentUserId, onClose, onInvite }) => {
  const [opponents, setOpponents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOpponents = async () => {
      setIsLoading(true);
      try {
        const data = await liveStreamService.getInvitableOpponents(currentUserId);
        setOpponents(data);
      } catch (error) {
        console.error("Failed to fetch opponents:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOpponents();
  }, [currentUserId]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={onClose}>
      <div 
        className="bg-[#1C1F24] w-full h-[50vh] max-h-[450px] rounded-t-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="w-6 h-6"></div>
          <h2 className="text-lg font-bold">Convidar para PK</h2>
          <button onClick={onClose}><CrossIcon className="w-6 h-6 text-gray-400" /></button>
        </header>
        <main className="flex-grow overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="text-center text-gray-400 pt-10">Carregando streamers...</div>
          ) : opponents.length > 0 ? (
            opponents.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg w-full bg-white/5">
                <img src={user.avatar_url} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-grow text-left">
                  <p className="font-semibold text-white truncate">{user.nickname || user.name}</p>
                  <p className="text-xs text-gray-400">Nível {user.level}</p>
                </div>
                <button 
                  onClick={() => onInvite(user.id)}
                  className="bg-red-600 text-white font-semibold text-sm px-5 py-2 rounded-full hover:bg-red-500 transition-colors"
                >
                  Convidar
                </button>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 pt-10">Nenhum outro streamer ao vivo no momento.</div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SelectOpponentModal;