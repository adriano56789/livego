import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CloseIcon, PlusIcon, GiftIcon, SearchIcon } from './icons';
import { User, ToastType, EligibleUser, Gift } from '../types';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';

interface PrivateInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamId: string;
  currentUser: User;
  addToast: (type: ToastType, message: string) => void;
  followingUsers: User[];
  onFollowUser: (user: User, streamId?: string) => void;
  allGifts: Gift[];
}

type AggregatedGift = EligibleUser['giftsSent'][0] & { price: number };

const PrivateInviteModal: React.FC<PrivateInviteModalProps> = ({ isOpen, onClose, streamId, currentUser, addToast, followingUsers, onFollowUser, allGifts }) => {
  const [activeTab, setActiveTab] = useState<'followers' | 'gifters'>('followers');
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set());
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
  const [isInvitingAll, setIsInvitingAll] = useState(false);
  const [isFollowingAll, setIsFollowingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'gifters' && eligibleUsers.length === 0) {
        setIsLoading(true);
        api.getGiftSendersForStream(streamId)
          .then(data => {
            setEligibleUsers(data || []);
          })
          .catch(err => {
            addToast(ToastType.Error, "Falha ao carregar usuários elegíveis.");
            console.error(err);
          })
          .finally(() => setIsLoading(false));
      } else if (activeTab === 'followers') {
        setIsLoading(false);
      }
    } else {
      // Reset state on close
      setEligibleUsers([]);
      setInvitedUsers(new Set());
      setInvitingUserId(null);
      setIsInvitingAll(false);
      setIsFollowingAll(false);
      setActiveTab('followers');
      setSearchTerm('');
    }
  }, [isOpen, streamId, addToast, activeTab]);
  
  const hasUnfollowedUsers = useMemo(() => {
    if (isLoading) return false;
    const currentList = activeTab === 'followers' ? followingUsers : eligibleUsers;
    return currentList.some(u => !followingUsers.some(f => f.id === u.id));
  }, [eligibleUsers, followingUsers, isLoading, activeTab]);

  const requiredGift = useMemo(() => {
    if (!eligibleUsers.length || !allGifts.length) return null;
    let mostExpensiveGift: Gift | null = null;
    let maxPrice = -1;

    for (const user of eligibleUsers) {
      for (const sentGift of user.giftsSent) {
        const giftInfo = allGifts.find(g => g.name === sentGift.name);
        if (giftInfo && (giftInfo.price || 0) > maxPrice) {
          maxPrice = giftInfo.price || 0;
          mostExpensiveGift = giftInfo;
        }
      }
    }
    return mostExpensiveGift;
  }, [eligibleUsers, allGifts]);

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const handleInvite = async (userToInvite: User, isBulkAction = false) => {
    if (invitedUsers.has(userToInvite.id) || invitingUserId === userToInvite.id) return;

    if (!isBulkAction) setInvitingUserId(userToInvite.id);
    try {
      await api.sendPrivateInviteToGifter(streamId, userToInvite.id);
      if (!isBulkAction) addToast(ToastType.Success, `Convite enviado para ${userToInvite.name}.`);
      setInvitedUsers(prev => new Set(prev).add(userToInvite.id));

      // Automatically follow the user if not already following (mutual follow)
      const isAlreadyFollowing = followingUsers.some(f => f.id === userToInvite.id);
      if (!isAlreadyFollowing) {
        onFollowUser(userToInvite, streamId);
      }
    } catch (error) {
      const message = (error as Error).message || "Falha ao enviar convite.";
      if (!isBulkAction) addToast(ToastType.Error, message);
    } finally {
      if (!isBulkAction) setInvitingUserId(null);
    }
  };
  
  const handleInviteAll = async () => {
    setIsInvitingAll(true);
    const usersToInvite = (activeTab === 'followers' ? filteredFollowers : filteredGifters).filter(u => !invitedUsers.has(u.id));

    for (const user of usersToInvite) {
        await handleInvite(user, true);
        await delay(200); 
    }
    
    setIsInvitingAll(false);
    if (usersToInvite.length > 0) {
        addToast(ToastType.Success, 'Todos os usuários elegíveis foram convidados.');
    }
  };

  const handleFollowAll = async () => {
    setIsFollowingAll(true);
    const usersToFollow = (activeTab === 'followers' ? followingUsers : eligibleUsers).filter(u => !followingUsers.some(f => f.id === u.id));

    for (const user of usersToFollow) {
        onFollowUser(user, streamId);
        await delay(200);
    }

    setIsFollowingAll(false);
    if(usersToFollow.length > 0) {
        addToast(ToastType.Success, 'Seguindo todos os usuários elegíveis.');
    }
  };

  const getButtonState = (userId: string) => {
      if (invitingUserId === userId || isInvitingAll) return { text: "Convidando...", disabled: true, className: "bg-gray-700 text-gray-400 cursor-wait" };
      if (invitedUsers.has(userId)) return { text: "Convidado", disabled: true, className: "bg-gray-700 text-gray-400 cursor-not-allowed" };
      return { text: "Convidar", disabled: false, className: "bg-pink-600 text-white hover:bg-pink-700" };
  };

  const filteredFollowers = useMemo(() => {
    if (!searchTerm) return followingUsers;
    const lowerCaseTerm = searchTerm.toLowerCase();
    return followingUsers.filter(user => 
        user.name.toLowerCase().includes(lowerCaseTerm) ||
        user.identification.toLowerCase().includes(lowerCaseTerm)
    );
  }, [followingUsers, searchTerm]);

  const filteredGifters = useMemo(() => {
      if (!searchTerm) return eligibleUsers;
      const lowerCaseTerm = searchTerm.toLowerCase();
      return eligibleUsers.filter(user => 
          user.name.toLowerCase().includes(lowerCaseTerm) ||
          user.identification.toLowerCase().includes(lowerCaseTerm)
      );
  }, [eligibleUsers, searchTerm]);

  return (
    <div className={`absolute inset-0 z-40 flex items-end justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}>
      <div className={`bg-[#181818] w-full max-w-md h-[70%] rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-y-0' : 'translate-y-full'}`} onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-gray-700/50 flex-shrink-0">
            <button onClick={onClose} className="text-gray-300 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
            <h2 className="text-base font-semibold text-white">Convidar para Sala Privada</h2>
            <div className="flex items-center space-x-2">
                {hasUnfollowedUsers && (
                    <button 
                        onClick={handleFollowAll} 
                        disabled={isFollowingAll}
                        className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600"
                    >
                        {isFollowingAll ? 'Seguindo...' : 'Seguir Todos'}
                    </button>
                )}
                <button 
                    onClick={handleInviteAll} 
                    disabled={isInvitingAll || (activeTab === 'followers' ? filteredFollowers : filteredGifters).every(u => invitedUsers.has(u.id))}
                    className="text-xs font-semibold px-3 py-1 rounded-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600"
                >
                    {isInvitingAll ? 'Convidando...' : 'Convidar Todos'}
                </button>
            </div>
        </header>

        <nav className="flex items-center justify-center space-x-6 px-4 border-b border-gray-700/50 flex-shrink-0">
            <button onClick={() => setActiveTab('followers')} className={`py-2 font-semibold ${activeTab === 'followers' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>Seguidores</button>
            <button onClick={() => setActiveTab('gifters')} className={`py-2 font-semibold ${activeTab === 'gifters' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>Doadores de presentes</button>
        </nav>

        <div className="px-4 pt-2 flex-shrink-0">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Pesquisar por nome ou ID"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-[#2C2C2E] text-white placeholder-gray-400 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
            </div>
        </div>

        <main className="flex-grow px-2 pt-2 overflow-y-auto no-scrollbar">
          {isLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : (
            activeTab === 'followers' ? (
              filteredFollowers.length > 0 ? (
                filteredFollowers.map(user => {
                  const buttonState = getButtonState(user.id);
                  return (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/50">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                            <div className="min-w-0">
                              <p className="text-white font-semibold text-sm truncate">{user.name}</p>
                              <p className="text-gray-400 text-xs truncate">ID: {user.identification}</p>
                            </div>
                        </div>
                        <button 
                           onClick={() => handleInvite(user)} 
                           disabled={buttonState.disabled}
                           className={`font-semibold px-4 py-1.5 rounded-full transition-colors text-xs w-24 text-center ${buttonState.className}`}
                        >
                          {buttonState.text}
                        </button>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-8">Nenhum seguidor encontrado.</p>
              )
            ) : (
              filteredGifters.length > 0 ? (
                filteredGifters.map(user => {
                    const buttonState = getButtonState(user.id);
                    const isFollowed = followingUsers.some(f => f.id === user.id);
                    const uniqueGifts: AggregatedGift[] = Object.values(user.giftsSent.reduce((acc, gift) => {
                      if (!acc[gift.name]) {
                        const fullGiftInfo = allGifts.find(g => g.name === gift.name);
                        acc[gift.name] = { ...gift, price: fullGiftInfo?.price || 0 };
                      } else {
                        acc[gift.name].quantity += gift.quantity;
                      }
                      return acc;
                    }, {} as Record<string, AggregatedGift>));
                    const mostExpensiveUserGift = uniqueGifts.length > 0 ? uniqueGifts.reduce((max, gift) => (gift.price > max.price) ? gift : max) : null;
                  return (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/50">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{user.name}</p>
                          {mostExpensiveUserGift && (
                          <div className={`flex items-center space-x-1 rounded-full px-1.5 py-0.5 mt-1 w-fit text-xs ${mostExpensiveUserGift.name === requiredGift?.name ? 'bg-yellow-500/20' : 'bg-black/30'}`}>
                            {mostExpensiveUserGift.component ? React.cloneElement(mostExpensiveUserGift.component, { className: 'w-3 h-3' }) : <span>{mostExpensiveUserGift.icon}</span>}
                            <span className={`text-xs ${mostExpensiveUserGift.name === requiredGift?.name ? 'text-yellow-300' : 'text-gray-300'}`}>x{mostExpensiveUserGift.quantity}</span>
                          </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                        {!isFollowed && (
                          <button onClick={() => onFollowUser(user, streamId)} className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs hover:bg-purple-700 transition-colors">
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleInvite(user)} 
                          disabled={buttonState.disabled}
                          className={`font-semibold px-4 py-1.5 rounded-full transition-colors text-xs w-24 text-center ${buttonState.className}`}
                        >
                          {buttonState.text}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-8">Ninguém enviou presentes nesta live ainda.</p>
              )
            )
          )}
        </main>
      </div>
    </div>
  );
};

export default PrivateInviteModal;