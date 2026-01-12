import React, { useState, useEffect } from 'react';
import { CloseIcon, SearchIcon } from '../icons';
import { api } from '../../services/api';
import { User } from '../../types';
import { LoadingSpinner } from '../Loading';

interface PrivateInviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    streamId: string;
    hostId: string;
}

const PrivateInviteModal: React.FC<PrivateInviteModalProps> = ({ isOpen, onClose, streamId, hostId }) => {
    const [activeTab, setActiveTab] = useState<'followers' | 'gifters'>('followers');
    const [users, setUsers] = useState<User[]>([]);
    const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Efeito para carregar dados via API baseada na aba e busca
    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                let data: User[] = [];
                
                if (searchTerm.length >= 1) {
                    // Busca global/filtrada via API
                    data = await api.users.search(searchTerm);
                } else if (activeTab === 'followers') {
                    // Busca seguidores do host via API
                    data = await api.users.getFansUsers(hostId);
                } else {
                    // Busca doadores da stream atual via API
                    data = await api.streams.getGiftDonors(streamId);
                }
                
                setUsers(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("[PrivateInvite] Erro ao buscar usuários na API Mocha:", err);
                setUsers([]);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(fetchData, searchTerm ? 400 : 0);
        return () => clearTimeout(timer);
    }, [activeTab, searchTerm, isOpen, streamId, hostId]);

    const handleInvite = async (userId: string) => {
        if (invitedIds.has(userId) || isActionLoading) return;
        
        setIsActionLoading(true);
        try {
            // Chamada Real para a API Mock
            const result = await api.streams.inviteToPrivateRoom(streamId, userId);
            if (result.success) {
                setInvitedIds(prev => new Set(prev).add(userId));
            }
        } catch (err) {
            console.error("[PrivateInvite] Falha no convite individual:", err);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleInviteAll = async () => {
        if (isActionLoading || users.length === 0) return;

        const toInvite = users.filter(u => !invitedIds.has(u.id));
        if (toInvite.length === 0) return;

        setIsActionLoading(true);
        try {
            // Executa convites em paralelo via API
            const promises = toInvite.map(u => 
                api.streams.inviteToPrivateRoom(streamId, u.id)
            );
            
            await Promise.all(promises);
            
            const newInvited = new Set(invitedIds);
            toInvite.forEach(u => newInvited.add(u.id));
            setInvitedIds(newInvited);
            
            console.log(`%c[MOCHA API] Convidados em massa: ${toInvite.length} usuários`, "color: #00E676; font-weight: bold");
        } catch (err) {
            console.error("[PrivateInvite] Falha no convite em massa:", err);
        } finally {
            setIsActionLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-transparent" onClick={onClose}>
            <div 
                className="w-full max-w-md bg-[#1C1C1E] rounded-t-2xl h-[75vh] flex flex-col animate-in slide-in-from-bottom duration-300 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Visual Drag Handle */}
                <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-3 shrink-0"></div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#1C1C1E] shrink-0">
                    <button onClick={onClose} className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors">
                        <CloseIcon className="w-6 h-6 text-white" />
                    </button>
                    <h2 className="text-white font-black text-base tracking-wide">Convidar para Sala Privada</h2>
                    <button 
                        onClick={handleInviteAll}
                        disabled={isActionLoading || users.length === 0}
                        className="bg-[#FE2C55] hover:bg-[#E02449] disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all shadow-lg active:scale-95"
                    >
                        {isActionLoading ? '...' : 'Convidar Todos'}
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5 shrink-0">
                    <button 
                        onClick={() => { setActiveTab('followers'); setSearchTerm(''); }}
                        className={`flex-1 py-4 text-[13px] font-black uppercase tracking-wider relative transition-all ${activeTab === 'followers' ? 'text-white' : 'text-gray-600'}`}
                    >
                        Seguidores
                        {activeTab === 'followers' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_10px_#a855f7]"></div>}
                    </button>
                    <button 
                        onClick={() => { setActiveTab('gifters'); setSearchTerm(''); }}
                        className={`flex-1 py-4 text-[13px] font-black uppercase tracking-wider relative transition-all ${activeTab === 'gifters' ? 'text-white' : 'text-gray-600'}`}
                    >
                        Doadores
                        {activeTab === 'gifters' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_10px_#a855f7]"></div>}
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 shrink-0">
                    <div className="bg-white/5 rounded-2xl flex items-center px-4 py-2.5 border border-white/5 focus-within:border-purple-500/50 transition-all">
                        <SearchIcon className="w-4 h-4 text-gray-500 mr-3" />
                        <input 
                            type="text"
                            placeholder="Pesquisar por nome ou ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent w-full text-white text-sm outline-none placeholder-gray-600 font-medium"
                        />
                    </div>
                </div>

                {/* List Area */}
                <div className="flex-1 overflow-y-auto px-4 pb-10 no-scrollbar bg-black/10">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-60 gap-4 opacity-50">
                            <LoadingSpinner />
                            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Consultando API Mocha...</span>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-60 text-gray-600 text-center px-10">
                            <p className="text-xs font-bold uppercase tracking-widest">Nenhum usuário encontrado</p>
                            <p className="text-[10px] mt-1">Verifique o termo buscado ou tente outra aba.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 pt-2">
                            {users.map(user => (
                                <div key={user.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img src={user.avatarUrl} className="w-12 h-12 rounded-full object-cover" alt={user.name} />
                                        <div>
                                            <p className="font-bold text-white text-sm">{user.name}</p>
                                            <p className="text-gray-500 text-xs">ID: {user.identification}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleInvite(user.id)}
                                        disabled={invitedIds.has(user.id) || isActionLoading}
                                        className={`text-xs font-bold px-4 py-2 rounded-full transition-colors ${invitedIds.has(user.id) ? 'bg-white/10 text-gray-500' : 'bg-purple-600 text-white'}`}
                                    >
                                        {invitedIds.has(user.id) ? 'Convidado' : 'Convidar'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PrivateInviteModal;