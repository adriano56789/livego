
import React, { useState, useEffect } from 'react';
import { CloseIcon, ClockIcon, FilterIcon, SearchIcon, BellOffIcon, QuestionMarkIcon, UserIcon, LiveIndicatorIcon } from './icons';
import { User, ToastType } from '../types';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';
import { useTranslation } from '../i18n';

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
      api.getFriends(currentUser.id)
        .then(data => setFriends(data || []))
        .catch(console.error)
        .finally(() => setIsLoading(false));
        
      setIsLoadingQuick(true);
      api.getQuickCompleteFriends()
        .then(data => setQuickCompleteFriends(data || []))
        .catch(console.error)
        .finally(() => setIsLoadingQuick(false));

    } else if (!isOpen) {
      // Reset state when modal closes
      setInvitedFriends(new Set());
      setSearchTerm('');
      setInvitingFriendId(null);
      setQuickCompleteFriends([]);
    }
  }, [isOpen, currentUser]);

  const handleInviteClick = async (friend: User) => {
    if (invitedFriends.has(friend.id) || invitingFriendId === friend.id) return;
    
    setInvitingFriendId(friend.id);
    addToast(ToastType.Info, `Convidando ${friend.name} para co-host...`);

    try {
      const { success, message, error } = await api.inviteFriendForCoHost(streamId, friend.id);
      if (success) {
        addToast(ToastType.Success, message || `Convite para ${friend.name} enviado.`);
        setInvitedFriends(prev => new Set(prev).add(friend.id));
        // This preserves the original UI flow (e.g., starting a PK battle)
        onInvite(friend); 
      } else {
        addToast(ToastType.Error, error || 'Falha ao enviar convite.');
      }
    } catch(err) {
      addToast(ToastType.Error, (err as Error).message || 'Erro de rede ao enviar convite.');
    } finally {
      setInvitingFriendId(null);
    }
  };

  const handleQuickInvite = async (quickFriend: QuickCompleteFriend) => {
    const friendToInvite = friends.find(f => f.id === quickFriend.id);
    if (!friendToInvite) {
        addToast(ToastType.Error, "Amigo não encontrado na sua lista.");
        return;
    }

    // This calls the existing invite logic which has its own state management
    handleInviteClick(friendToInvite); 

    // And also update the quick complete status
    try {
        const { success, friend: updatedFriendData } = await api.completeQuickFriendTask(quickFriend.id);
        if (success && updatedFriendData) {
            setQuickCompleteFriends(prev => 
                prev.map(f => f.id === quickFriend.id ? { ...f, status: 'concluido' } : f)
            );
        } else {
            throw new Error("Falha ao atualizar status da tarefa.");
        }
    } catch (err) {
        addToast(ToastType.Error, (err as Error).message);
    }
  };

  const filteredFriends = friends.filter(friend => friend.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const title = t('cohost.title');

  const getButtonState = (friendId: string) => {
      if (invitingFriendId === friendId) return { text: "Convidando...", disabled: true, className: "bg-gray-700 text-gray-400 cursor-wait" };
      if (invitedFriends.has(friendId)) return { text: t('common.invited'), disabled: true, className: "bg-gray-700 text-gray-400 cursor-not-allowed" };
      return { text: t('common.invite'), disabled: false, className: "bg-pink-600 text-white hover:bg-pink-700" };
  };

  return (
    <div
      className={`absolute inset-0 z-40 flex items-end justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose}
    >
      <div
        className={`bg-[#181818] w-full max-w-md h-[70%] rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-700/50 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <button onClick={onClose} className="text-gray-300 hover:text-white">
              <CloseIcon className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={onOpenTimerSettings} className="text-gray-300 hover:text-white">
              <ClockIcon className="w-6 h-6" />
            </button>
            <button className="text-gray-300 hover:text-white">
              <FilterIcon className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-grow p-4 space-y-4 overflow-y-auto no-scrollbar">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('cohost.searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#2C2C2E] text-white placeholder-gray-400 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="flex items-center justify-between bg-[#2C2C2E] p-3 rounded-lg">
              <div className="flex items-center space-x-3">
              <BellOffIcon className="w-6 h-6 text-gray-400" />
              <span className="text-white">{t('cohost.friendsOnly')}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
          </div>
          
          {/* Quick invites */}
          <div className="bg-[#2C2C2E] p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white text-sm font-semibold">Faça novos amigos</h3>
                  <span className="text-xs text-gray-400">Concluídos rápidos</span>
              </div>
              {isLoadingQuick ? <div className="flex justify-center py-4"><LoadingSpinner /></div> : (
              <div className="space-y-2">
                  {quickCompleteFriends.slice(0, 7).map(friend => {
                      const fullFriend = friends.find(f => f.id === friend.id);
                      const buttonState = friend.status === 'concluido' 
                          ? { text: "Concluído", disabled: true, className: "bg-gray-700 text-gray-400 cursor-not-allowed" }
                          : getButtonState(friend.id);

                      return (
                      <div key={friend.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                              <img src={fullFriend?.avatarUrl || `https://i.pravatar.cc/32?u=${friend.id}`} alt={friend.name} className="w-8 h-8 rounded-full object-cover" />
                              <span className="text-gray-200 text-sm">{friend.name}</span>
                          </div>
                          <button
                              onClick={() => handleQuickInvite(friend)}
                              disabled={buttonState.disabled}
                              className={`text-xs font-semibold px-4 py-1.5 rounded-full ${buttonState.className}`}
                          >
                              {buttonState.text}
                          </button>
                      </div>
                  )})}
              </div>
              )}
          </div>


          {/* Friends List */}
          <div>
            <h3 className="text-gray-400 text-sm font-semibold mb-2">{t('cohost.friendsListTitle', { count: filteredFriends.length })}</h3>
            {isLoading ? (
                <div className="flex justify-center py-8"><LoadingSpinner /></div>
            ) : filteredFriends.length > 0 ? (
                filteredFriends.map(friend => {
                    const buttonState = getButtonState(friend.id);
                    return (
                        <div key={friend.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/50">
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <img src={friend.avatarUrl} alt={friend.name} className="w-12 h-12 rounded-full object-cover bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" />
                                    {friend.isLive ? (
                                        <div className="absolute bottom-0 right-0 bg-black p-0.5 rounded-full">
                                            <LiveIndicatorIcon className="w-3 h-3 text-red-500" />
                                        </div>
                                    ) : friend.isOnline && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#181818]"></div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-white font-semibold">{friend.name}</p>
                                    <div className="flex items-center space-x-1 text-gray-400 text-xs">
                                        <UserIcon className="w-3 h-3"/>
                                        <span>ID: {friend.identification}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleInviteClick(friend)} 
                                disabled={buttonState.disabled}
                                className={`font-semibold px-6 py-2 rounded-full transition-colors text-sm w-28 text-center ${buttonState.className}`}
                            >
                                {buttonState.text}
                            </button>
                        </div>
                    );
                })
            ) : (
                <p className="text-center text-gray-500 py-8">{t('cohost.noFriends')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoHostModal;
