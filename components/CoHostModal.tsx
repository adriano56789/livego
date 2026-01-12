
import React, { useState, useEffect } from 'react';
import { CloseIcon, ClockIcon, FilterIcon, SearchIcon, BellOffIcon, QuestionMarkIcon, UserIcon, LiveIndicatorIcon, CheckIcon } from '@/components/icons';
import { User, ToastType } from '@/types';
import { api } from '@/services/api';
import { LoadingSpinner } from '@/components/Loading';
import { useTranslation } from '@/i18n';

interface CoHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (friend: User) => void;
  onOpenTimerSettings: () => void;
  currentUser: User;
  addToast: (type: ToastType, message: string) => void;
  streamId: string;
}

interface QuickCompleteFriend {
  id: string;
  name: string;
  status: 'concluido' | 'pendente';
}

const CoHostModal: React.FC<CoHostModalProps> = ({ isOpen, onClose, onInvite, onOpenTimerSettings, currentUser, addToast, streamId }) => {
  const { t } = useTranslation();
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [invitedFriends, setInvitedFriends] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [invitingFriendId, setInvitingFriendId] = useState<string | null>(null);
  const [quickCompleteFriends, setQuickCompleteFriends] = useState<QuickCompleteFriend[]>([]);
  const [isLoadingQuick, setIsLoadingQuick] = useState(true);


  useEffect(() => {
    if (isOpen && currentUser) {
      setIsLoading(true);
      console.log(`[CO-HOST] Carregando amigos para usuário: ${currentUser.id}`);
      
      api.users.getFriends(currentUser.id)
        .then((data: any) => {
            const list = Array.isArray(data) ? data : (data?.data || []);
            setFriends(list);
        })
        .catch(err => {
            console.error("[CO-HOST] Erro ao buscar amigos:", err);
            setFriends([]);
        })
        .finally(() => setIsLoading(false));
        
      setIsLoadingQuick(true);
      api.getQuickCompleteFriends()
        .then((data: any) => {
            const list = Array.isArray(data) ? data : (data?.data || []);
            setQuickCompleteFriends(list);
        })
        .catch(() => setQuickCompleteFriends([]))
        .finally(() => setIsLoadingQuick(false));

    } else if (!isOpen) {
      setInvitedFriends(new Set());
      setSearchTerm('');
      setInvitingFriendId(null);
    }
  }, [isOpen, currentUser]);

  const handleInviteClick = async (friend: User) => {
    if (invitedFriends.has(friend.id) || invitingFriendId === friend.id) return;
    
    setInvitingFriendId(friend.id);
    addToast(ToastType.Info, `Convidando ${friend.name}...`);

    try {
      const result = await api.inviteFriendForCoHost(streamId, friend.id);
      if (result.success) {
        addToast(ToastType.Success, `Convite enviado para ${friend.name}`);
        setInvitedFriends(prev => new Set(prev).add(friend.id));
        onInvite(friend); 
      }
    } catch(err) {
      addToast(ToastType.Error, 'Falha ao enviar convite.');
    } finally {
      setInvitingFriendId(null);
    }
  };

  const handleQuickInvite = async (quickFriend: QuickCompleteFriend) => {
    try {
        const result = await api.completeQuickFriendTask(quickFriend.id);
        if (result.success) {
            setQuickCompleteFriends(prev => 
                prev.map(f => f.id === quickFriend.id ? { ...f, status: 'concluido' } : f)
            );
            addToast(ToastType.Success, "Tarefa concluída!");
        }
    } catch (err) {
        addToast(ToastType.Error, "Erro ao processar tarefa.");
    }
  };

  // Verificação de segurança antes do filter para evitar crash
  const safeFriends = Array.isArray(friends) ? friends : [];
  const filteredFriends = safeFriends.filter(friend => 
    friend.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getButtonState = (friendId: string) => {
      if (invitingFriendId === friendId) return { text: "...", disabled: true, className: "bg-gray-700 text-gray-400" };
      if (invitedFriends.has(friendId)) return { text: "Convidado", disabled: true, className: "bg-gray-800 text-gray-500" };
      return { text: "Convidar", disabled: false, className: "bg-pink-600 text-white" };
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-300 ${isOpen ? 'bg-black/20' : 'opacity-0 pointer-events-none'}`} onClick={onClose}>
      <div className={`bg-[#181818] w-full max-w-md h-[75%] rounded-t-3xl shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-y-0' : 'translate-y-full'}`} onClick={e => e.stopPropagation()}>
        
        <header className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center space-x-4">
            <button onClick={onClose} className="text-gray-400 p-1"><CloseIcon className="w-6 h-6" /></button>
            <h2 className="text-white font-bold text-base">Convidar Co-Host</h2>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={onOpenTimerSettings} className="text-gray-400 p-1"><ClockIcon className="w-5 h-5" /></button>
            <button className="text-gray-400 p-1"><FilterIcon className="w-5 h-5" /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Pesquisar amigos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#2C2C2E] text-white text-sm rounded-xl py-2.5 pl-10 pr-4 outline-none border border-transparent focus:border-pink-500/50"
            />
          </div>

          <div className="flex items-center justify-between bg-[#2C2C2E]/50 p-3 rounded-2xl border border-white/5">
              <div className="flex items-center space-x-3">
                <BellOffIcon className="w-5 h-5 text-gray-500" />
                <span className="text-gray-200 text-sm">Apenas amigos</span>
              </div>
              <div className="w-10 h-5 bg-pink-600 rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
          </div>
          
          <div className="bg-[#2C2C2E]/30 p-4 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white text-xs font-bold uppercase tracking-widest opacity-60">Faça novos amigos</h3>
                  <span className="text-[10px] text-pink-400 font-bold">MISSÃO DIÁRIA</span>
              </div>
              {isLoadingQuick ? <div className="flex justify-center py-4"><LoadingSpinner /></div> : (
                <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2">
                    {quickCompleteFriends.map(friend => (
                        <div key={friend.id} className="flex flex-col items-center min-w-[70px] gap-2">
                            <div className="relative">
                                <img src={`https://picsum.photos/seed/${friend.id}/100`} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                                {friend.status === 'concluido' && <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5"><CheckIcon className="w-2.5 h-2.5 text-white" /></div>}
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium truncate w-16 text-center">{friend.name}</span>
                            <button 
                                onClick={() => handleQuickInvite(friend)}
                                disabled={friend.status === 'concluido'}
                                className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${friend.status === 'concluido' ? 'bg-white/5 text-gray-600' : 'bg-pink-600 text-white'}`}
                            >
                                {friend.status === 'concluido' ? 'OK' : 'Invite'}
                            </button>
                        </div>
                    ))}
                </div>
              )}
          </div>

          <div>
            <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-3">Sua lista de Amigos ({filteredFriends.length})</h3>
            {isLoading ? (
                <div className="flex justify-center py-10"><LoadingSpinner /></div>
            ) : filteredFriends.length > 0 ? (
                <div className="space-y-3">
                    {filteredFriends.map(friend => {
                        const btn = getButtonState(friend.id);
                        return (
                            <div key={friend.id} className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/5 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <div className="relative">
                                        <img src={friend.avatarUrl} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#181818]"></div>
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm">{friend.name}</p>
                                        <p className="text-gray-500 text-[10px]">ID: {friend.identification}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleInviteClick(friend)} 
                                    disabled={btn.disabled}
                                    className={`font-black text-[10px] uppercase px-5 py-2 rounded-full transition-all active:scale-95 ${btn.className}`}
                                >
                                    {btn.text}
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-10 opacity-30">
                    <UserIcon className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-xs">Nenhum amigo online no momento.</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoHostModal;
