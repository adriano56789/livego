import React, { useState, useEffect, useCallback } from 'react';
import CrossIcon from './icons/CrossIcon';
import EmptyBoxIcon from './icons/EmptyBoxIcon';
import * as liveStreamService from '../services/liveStreamService';
import type { Viewer } from '../types';

interface MuteUserModalProps {
  liveId: number;
  mutedUsers: Record<number, { mutedUntil: string }>;
  onMuteUser: (userId: number, mute: boolean) => void;
  onKickUser: (userId: number) => void;
  onClose: () => void;
}

const MuteUserModal: React.FC<MuteUserModalProps> = ({ liveId, mutedUsers, onMuteUser, onKickUser, onClose }) => {
  const [activeTab, setActiveTab] = useState<'silenciamento' | 'expulsao'>('silenciamento');
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchViewers = useCallback(async () => {
    setIsLoading(true);
    try {
        const viewerData = await liveStreamService.getViewers(liveId);
        // The mock API for getViewers adds the streamer with a very high contribution.
        // We filter them out so the host can't mute/kick themselves.
        setViewers(viewerData.filter(v => v.contribution < 999999));
    } catch (error) {
        console.error("Failed to fetch viewers for mute modal:", error);
    } finally {
        setIsLoading(false);
    }
  }, [liveId]);

  useEffect(() => {
    fetchViewers();
  }, [fetchViewers]);

  const UserRow: React.FC<{ user: Viewer }> = ({ user }) => {
    const isMuted = !!mutedUsers[user.id];
    return (
        <div className="flex items-center p-3">
            <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover mr-3" />
            <div className="flex-grow">
                <p className="font-semibold text-black">{user.name}</p>
                <p className="text-xs text-gray-500">ID: {user.id}</p>
            </div>
            {activeTab === 'silenciamento' ? (
                <button
                    onClick={() => onMuteUser(user.id, !isMuted)}
                    className={`font-semibold text-sm px-4 py-2 rounded-full ${isMuted ? 'bg-gray-200 text-gray-600' : 'bg-yellow-400 text-black'}`}
                >
                    {isMuted ? 'Reativar som' : 'Silenciar'}
                </button>
            ) : (
                <button
                    onClick={() => onKickUser(user.id)}
                    className="font-semibold text-sm px-4 py-2 rounded-full bg-red-500 text-white"
                >
                    Expulsar
                </button>
            )}
        </div>
    );
  };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end" onClick={onClose}>
            <div 
                className="bg-white w-full rounded-t-2xl flex flex-col text-black animate-slide-up-fast h-[75vh] max-h-[600px]"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 flex items-center justify-center relative shrink-0 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setActiveTab('silenciamento')}
                            className={`font-bold text-lg ${activeTab === 'silenciamento' ? 'text-black' : 'text-gray-400'}`}
                        >
                            Silenciamento
                        </button>
                        <button 
                            onClick={() => setActiveTab('expulsao')}
                            className={`font-bold text-lg ${activeTab === 'expulsao' ? 'text-black' : 'text-gray-400'}`}
                        >
                            Expulsão
                        </button>
                    </div>
                    <button onClick={onClose} className="absolute top-1/2 right-4 -translate-y-1/2 p-2 -m-2">
                        <CrossIcon className="w-6 h-6 text-gray-400" />
                    </button>
                </header>
                <main className="flex-grow overflow-y-auto">
                    {isLoading ? (
                        <div className="text-center text-gray-500 py-10">Carregando usuários...</div>
                    ) : viewers.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {viewers.map(viewer => <UserRow key={viewer.id} user={viewer} />)}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center text-gray-500 py-20">
                            <EmptyBoxIcon className="w-24 h-24 mb-4" />
                            <h3 className="font-semibold text-lg">Nenhum usuário aqui</h3>
                            <p className="text-sm">Não há ninguém na sala para {activeTab === 'silenciamento' ? 'silenciar' : 'expulsar'}.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default MuteUserModal;