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
        setViewers(viewerData);
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
            <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
            <div className="flex-grow ml-3 overflow-hidden">
                <p className="font-semibold truncate">{user.name}</p>
                <p className="text-xs text-gray-500">ID: {user.id}</p>
            </div>
            <div className="ml-3 shrink-0">
                {activeTab === 'silenciamento' ? (
                    <button 
                        onClick={() => onMuteUser(user.id, !isMuted)}
                        className={`w-24 font-semibold text-sm px-4 py-2 rounded-full transition-colors ${
                            isMuted ? 'bg-gray-200 text-gray-700' : 'bg-red-500 text-white'
                        }`}
                    >
                        {isMuted ? 'Dessilenciar' : 'Silenciar'}
                    </button>
                ) : (
                     <button
                        onClick={() => onKickUser(user.id)}
                        className="w-24 bg-black text-white font-semibold text-sm px-4 py-2 rounded-full transition-colors hover:bg-gray-800"
                    >
                        Expulsar
                    </button>
                )}
            </div>
        </div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
        return <div className="flex justify-center items-center h-full text-gray-500">Carregando usuários...</div>;
    }

    if (viewers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-16">
                <EmptyBoxIcon className="w-32 h-32 opacity-50" />
                <p className="mt-4">Nenhum usuário encontrado</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-200">
            {viewers.map(viewer => <UserRow key={viewer.id} user={viewer} />)}
        </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 bg-transparent z-50 flex items-end"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full h-[60vh] max-h-[500px] rounded-t-2xl flex flex-col text-black animate-slide-up-fast"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 flex items-center justify-center relative shrink-0">
            <div className="flex items-center justify-center border border-gray-200 rounded-full p-1">
                <button 
                    onClick={() => setActiveTab('silenciamento')}
                    className={`px-6 py-1.5 rounded-full font-semibold text-sm transition-colors ${activeTab === 'silenciamento' ? 'bg-black text-white' : 'text-gray-600'}`}
                >
                    Silenciamento
                </button>
                <button 
                    onClick={() => setActiveTab('expulsao')}
                    className={`px-8 py-1.5 rounded-full font-semibold text-sm transition-colors ${activeTab === 'expulsao' ? 'bg-black text-white' : 'text-gray-600'}`}
                >
                    Expulsão
                </button>
            </div>
            <button onClick={onClose} className="absolute top-1/2 -translate-y-1/2 right-4">
                <CrossIcon className="w-6 h-6 text-gray-400" />
            </button>
        </header>
        <main className="flex-grow overflow-y-auto px-4 scrollbar-hide">
          {renderContent()}
        </main>
      </div>
       <style>{`
        @keyframes slide-up-fast { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up-fast { animation: slide-up-fast 0.25s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default MuteUserModal;