import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CloseIcon, PlusIcon, GiftIcon } from './icons';
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
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set());
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
  const [isInvitingAll, setIsInvitingAll] = useState(false);
  const [isFollowingAll, setIsFollowingAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
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
    } else {
      // Reset state on close
      setEligibleUsers([]);
      setInvitedUsers(new Set());
      setInvitingUserId(null);
      setIsInvitingAll(false);
      setIsFollowingAll(false);
    }
  }, [isOpen, streamId, addToast]);
  
  const hasUnfollowedUsers = useMemo(() => {
    if (isLoading) return false;
    return eligibleUsers.some(u => !followingUsers.some(f => f.id === u.id));
  }, [eligibleUsers, followingUsers, isLoading]);

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
    } catch (error) {
      const message = (error as Error).message || "Falha ao enviar convite.";
      if (!isBulkAction) addToast(ToastType.Error, message);
    } finally {
      if (!isBulkAction) setInvitingUserId(null);
    }
  };
  
  const handleInviteAll = async () => {
    setIsInvitingAll(true);
    const usersToInvite = eligibleUsers.filter(u => !invitedUsers.has(u.id));

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
    const usersToFollow = eligibleUsers.filter(u => !followingUsers.some(f => f.id === u.id));

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
                    disabled={isInvitingAll || eligibleUsers.every(u => invitedUsers.has(u.id))}
                    className="text-xs font-semibold px-3 py-1 rounded-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600"
                >
                    {isInvitingAll ? 'Convidando...' : 'Convidar Todos'}
                </button>
            </div>
        </header>

        <div className="flex-grow px-2 pt-4 overflow-y-auto no-scrollbar">
          {isLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : eligibleUsers.length > 0 ? (
            eligibleUsers.map(user => {
              const buttonState = getButtonState(user.id);
              const isFollowed = followingUsers.some(f => f.id === user.id);
              
              const aggregatedGiftsWithPrice = user.giftsSent.reduce((acc, gift) => {
                if (acc[gift.name]) {
                  acc[gift.name].quantity += gift.quantity;
                } else {
                  const fullGiftInfo = allGifts.find(g => g.name === gift.name);
                  acc[gift.name] = { ...gift, price: fullGiftInfo?.price || 0 };
                }
                return acc;
              }, {} as Record<string, AggregatedGift>);

              const uniqueGifts: AggregatedGift[] = Object.values(aggregatedGiftsWithPrice);

              const mostExpensiveUserGift = uniqueGifts.length > 0
                ? uniqueGifts.reduce((max, gift) => (gift.price > max.price) ? gift : max)
                : null;

              return (
                <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/50">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">{user.name}</p>
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
                        {mostExpensiveUserGift ? (
                            <>
                                <div 
                                    className={`flex items-center space-x-1.5 rounded-full px-2 py-0.5 transition-all ${mostExpensiveUserGift.name === requiredGift?.name ? 'bg-yellow-500/20 ring-1 ring-yellow-400' : 'bg-black/30'}`}
                                    title={mostExpensiveUserGift.name === requiredGift?.name ? 'Presente de convite' : ''}
                                >
                                    {mostExpensiveUserGift.component ? React.cloneElement(mostExpensiveUserGift.component, { className: 'w-4 h-4' }) : <span>{mostExpensiveUserGift.icon}</span>}
                                    <span className={`text-xs ${mostExpensiveUserGift.name === requiredGift?.name ? 'text-yellow-300' : 'text-gray-300'}`}>x{mostExpensiveUserGift.quantity}</span>
                                </div>
                                {uniqueGifts.length > 1 && (
                                    <span className="text-xs text-gray-400 ml-1">+{uniqueGifts.length - 1} outros</span>
                                )}
                            </>
                        ) : (
                           user.giftsSent.length > 0 &&
                            <div className="flex items-center space-x-1.5 rounded-full px-2 py-0.5 bg-black/30">
                                <GiftIcon className="w-4 h-4 text-gray-400"/>
                                <span className="text-xs text-gray-300">x{user.giftsSent.reduce((sum, g) => sum + g.quantity, 0)}</span>
                            </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                    {!isFollowed && (
                      <button 
                        onClick={() => onFollowUser(user, streamId)}
                        className="bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-xs hover:bg-purple-700 transition-colors"
                        aria-label={`Seguir ${user.name}`}
                      >
                        <PlusIcon className="w-5 h-5" />
                      </button>
                    )}
                    <button 
                      onClick={() => handleInvite(user)} 
                      disabled={buttonState.disabled}
                      className={`font-semibold px-4 py-2 rounded-full transition-colors text-sm w-28 text-center ${buttonState.className}`}
                    >
                      {buttonState.text}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-500 py-8">Ninguém enviou presentes nesta live ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivateInviteModal;