import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Gift, User } from '../../types';
import { YellowDiamondIcon, CheckIcon, ChevronDownIcon } from '../icons';
import { useTranslation } from '../../i18n';
import { GIFTS } from '../../constants';

interface GiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
    onUpdateUser?: (user: User) => void;
    onSendGift: (gift: Gift, quantity: number, targetId?: string) => Promise<User | null> | void;
    onRecharge: () => void;
    gifts?: Gift[];
    receivedGifts?: (Gift & { count: number })[];
    isBroadcaster?: boolean;
    onOpenVIPCenter: () => void;
    streamId?: string;
    hostId?: string;
    onlineUsers?: User[];
    hostUser?: User;
}

const STORAGE_KEY_PREFIX = 'livego:giftOrder:';

const GiftModal: React.FC<GiftModalProps> = ({ 
    isOpen, 
    onClose, 
    currentUser,
    onSendGift, 
    onRecharge, 
    gifts = GIFTS, 
    receivedGifts = [], 
    isBroadcaster = false, 
    onOpenVIPCenter,
    hostUser,
    onlineUsers,
}) => {
    const { t } = useTranslation();
    const userDiamonds = currentUser.diamonds;
    const isVIP = !!currentUser.isVIP;

    const [isEditMode, setIsEditMode] = useState(false);
    const [giftsByTab, setGiftsByTab] = useState<Record<string, Gift[]>>({});
    const [targetUser, setTargetUser] = useState<User>(hostUser || currentUser);
    const [isUserSelectorOpen, setIsUserSelectorOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const dragItem = useRef<Gift | null>(null);
    const dragOverItem = useRef<Gift | null>(null);

    useEffect(() => {
        if (isOpen && hostUser) {
            setTargetUser(hostUser);
        }
    }, [isOpen, hostUser]);

    useEffect(() => {
        if (!isOpen) return;

        const groupedGifts = gifts.reduce((acc, gift) => {
            const category = gift.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(gift);
            return acc;
        }, {} as Record<string, Gift[]>);

        Object.keys(groupedGifts).forEach(category => {
            try {
                const savedOrderIdsJson = localStorage.getItem(`${STORAGE_KEY_PREFIX}${category}`);
                if (savedOrderIdsJson) {
                    const savedOrderIds = JSON.parse(savedOrderIdsJson);
                    if (Array.isArray(savedOrderIds)) {
                        const giftMap = new Map(groupedGifts[category].map(g => [g.id, g]));
                        const orderedGifts: Gift[] = [];
                        
                        savedOrderIds.forEach(id => {
                            if (giftMap.has(id)) {
                                orderedGifts.push(giftMap.get(id)!);
                                giftMap.delete(id);
                            }
                        });

                        giftMap.forEach(newGift => orderedGifts.push(newGift));
                        
                        groupedGifts[category] = orderedGifts;
                    }
                }
            } catch (e) {
                console.warn(`Failed to parse gift order for ${category}`, e);
            }
        });

        setGiftsByTab(groupedGifts);
    }, [gifts, isOpen]);

    const giftCategories = useMemo(() => {
        const categories: (Gift['category'] | 'Galeria' | 'Mochila')[] = ['Mochila', 'Popular', 'Luxo', 'Atividade', 'VIP', 'Efeito', 'Entrada', 'Galeria'];
        return categories.filter(c => c !== 'VIP' || isVIP);
    }, [isVIP]);

    const [activeTab, setActiveTab] = useState<(Gift['category'] | 'Galeria' | 'Mochila')>(giftCategories[0]);
    const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
    const [quantity, setQuantity] = useState(1);
    const presetQuantities = [1, 10, 99, 188, 520, 1314];

    useEffect(() => {
        if (isEditMode) {
            setSelectedGift(null);
        }
    }, [isEditMode]);

    useEffect(() => {
        setIsEditMode(false);
    }, [activeTab]);
    
    const backpackGifts = useMemo((): Gift[] => {
        if (!currentUser.ownedGifts) return [];
        return currentUser.ownedGifts.map(owned => {
            const giftDetails = gifts.find(g => g.id === owned.giftId);
            if (!giftDetails) return null;
            return {
                ...giftDetails,
                isFromBackpack: true,
                ownedQuantity: owned.quantity
            };
        // FIX: Replaced a faulty type predicate with `.filter(Boolean) as Gift[]`, a common pattern to filter out falsy values and assert the resulting type.
        }).filter(Boolean) as Gift[];
    }, [currentUser.ownedGifts, gifts]);

    const filteredGifts = useMemo(() => {
        if (activeTab === 'Galeria' || activeTab === 'Mochila') return [];
        return giftsByTab[activeTab as string] || [];
    }, [activeTab, giftsByTab]);
    
    const maxCanSend = useMemo(() => {
        if (!selectedGift) return 0;
        if (selectedGift.isFromBackpack) {
            return selectedGift.ownedQuantity || 0;
        }
        if (!selectedGift.price || selectedGift.price === 0) return 9999;
        return Math.floor(userDiamonds / selectedGift.price);
    }, [selectedGift, userDiamonds]);

    const handleSend = async () => {
        if (isEditMode || !selectedGift || isSending) return;
        setIsSending(true);
        let sentSuccessfully = false;
        
        if (selectedGift.isFromBackpack) {
            if (quantity > 0 && quantity <= (selectedGift.ownedQuantity || 0)) {
                const updatedUser = await onSendGift(selectedGift, quantity, targetUser.id);
                if (updatedUser) sentSuccessfully = true;
            }
        } else {
            if (quantity > 0 && quantity * (selectedGift.price || 0) <= userDiamonds) {
                const updatedUser = await onSendGift(selectedGift, quantity, targetUser.id);
                if (updatedUser) sentSuccessfully = true;
            } else {
                onRecharge();
            }
        }
    
        setIsSending(false);
        if (sentSuccessfully) {
            setSelectedGift(null);
            setQuantity(1);
            onClose();
        }
    };

    const handleSelectGift = (gift: Gift) => {
        setSelectedGift(gift);
        setQuantity(1);
    };

    const canReorderCurrentTab = useMemo(() => {
        return ['Popular', 'Luxo', 'Atividade', 'VIP', 'Efeito'].includes(activeTab);
    }, [activeTab]);
    
    const handleDragStart = (gift: Gift) => {
        dragItem.current = gift;
    };
    
    const handleDragEnter = (gift: Gift) => {
        dragOverItem.current = gift;
    };
    
    const handleDrop = () => {
        if (!dragItem.current || !dragOverItem.current || !giftsByTab[activeTab as string]) return;
    
        const currentGifts = [...giftsByTab[activeTab as string]];
        const dragItemIndex = currentGifts.findIndex(g => g.id === dragItem.current!.id);
        const dragOverItemIndex = currentGifts.findIndex(g => g.id === dragOverItem.current!.id);
    
        if (dragItemIndex === -1 || dragOverItemIndex === -1 || dragItemIndex === dragOverItemIndex) {
            return;
        }
    
        const newGifts = [...currentGifts];
        const [draggedItem] = newGifts.splice(dragItemIndex, 1);
        newGifts.splice(dragOverItemIndex, 0, draggedItem);
    
        setGiftsByTab(prev => ({
            ...prev,
            [activeTab as string]: newGifts
        }));

        try {
            const newOrderIds = newGifts.map(g => g.id);
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${activeTab}`, JSON.stringify(newOrderIds));
        } catch (e) {
            console.error('Failed to save gift order to localStorage', e);
        }

        dragItem.current = null;
        dragOverItem.current = null;
    };
    
    const handleRestoreDefault = () => {
        try {
            localStorage.removeItem(`${STORAGE_KEY_PREFIX}${activeTab}`);
            const defaultGiftsForTab = GIFTS.filter(g => g.category === activeTab);
            setGiftsByTab(prev => ({
                ...prev,
                [activeTab as string]: defaultGiftsForTab
            }));
        } catch (e) {
            console.error('Failed to restore default gift order', e);
        }
    };

    const selectableUsers = useMemo(() => {
        const list: User[] = [];
        if (hostUser) list.push(hostUser);
        (currentUser.followers || []).forEach(uId => {
            // FIX: Replaced non-existent `(currentUser as any).allUsers` with the `onlineUsers` prop.
            const user = onlineUsers?.find(u => u.id === uId);
            if (user && (!hostUser || user.id !== hostUser.id)) {
                list.push(user);
            }
        });
        return list;
    }, [hostUser, currentUser, onlineUsers]);

    return (
        <div 
            className={`absolute inset-0 z-30 flex items-end ${isOpen ? '' : 'pointer-events-none'}`} 
            onClick={onClose}
        >
            <div 
                className={`bg-[#1C1C1E] w-full max-w-md h-[65%] rounded-t-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`} 
                onClick={e => e.stopPropagation()}
            >
                <header className="flex-shrink-0 p-3">
                    <div className="flex justify-between items-center mb-2 relative text-center h-9">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            {canReorderCurrentTab && (
                                <button 
                                    onClick={() => setIsEditMode(!isEditMode)} 
                                    className="text-sm font-semibold text-purple-400 px-3 py-1 rounded-full bg-purple-500/10 hover:bg-purple-500/20"
                                >
                                    {isEditMode ? t('gifts.done') : t('gifts.reorder')}
                                </button>
                            )}
                            {isEditMode && (
                                <button 
                                    onClick={handleRestoreDefault}
                                    className="text-sm font-semibold text-gray-500 hover:text-white"
                                >
                                    Restaurar
                                </button>
                            )}
                        </div>
                        <h2 className="text-base font-bold text-white mx-auto">{t('gifts.title')}</h2>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2">
                            <div className="flex items-center space-x-2 bg-[#2C2C2E] p-1.5 rounded-full">
                                <YellowDiamondIcon className="w-5 h-5 text-yellow-400" />
                                <span className="text-white font-semibold text-sm">{userDiamonds.toLocaleString('pt-BR')}</span>
                                <button onClick={onRecharge} className="text-xs text-yellow-400 font-bold bg-yellow-400/20 px-2 py-0.5 rounded-full hover:bg-yellow-400/30">{t('gifts.recharge')}</button>
                            </div>
                        </div>
                    </div>

                    <div className="px-1 py-1 relative">
                        <div className="bg-black/20 p-1.5 rounded-full flex items-center text-xs">
                            <span className="text-gray-400 px-2 font-bold">Para:</span>
                            <div className="relative flex-1">
                                <button onClick={() => setIsUserSelectorOpen(!isUserSelectorOpen)} className="bg-white/10 rounded-full w-full p-1.5 flex items-center justify-between text-left">
                                    <div className="flex items-center gap-2">
                                        <img src={targetUser.avatarUrl} className="w-5 h-5 rounded-full" alt={targetUser.name} />
                                        <span className="text-white font-bold text-xs">{targetUser.name}</span>
                                    </div>
                                    <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isUserSelectorOpen ? 'rotate-180' : ''}`}/>
                                </button>
                                {isUserSelectorOpen && (
                                    <div className="absolute bottom-full mb-1 w-full bg-[#2C2C2E] rounded-lg max-h-48 overflow-y-auto border border-white/10 z-10 shadow-lg">
                                    {selectableUsers.map(user => (
                                        <div key={user.id} onClick={() => { setTargetUser(user); setIsUserSelectorOpen(false); }} className="flex items-center gap-3 p-3 hover:bg-white/10 cursor-pointer">
                                        <img src={user.avatarUrl} className="w-8 h-8 rounded-full" alt={user.name} />
                                        <span className="text-white text-sm font-semibold">{user.name}</span>
                                        {user.id === targetUser.id && <CheckIcon className="w-4 h-4 text-purple-400 ml-auto" />}
                                        </div>
                                    ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <nav className="flex items-center space-x-4 border-b border-gray-700 mt-2">
                        {giftCategories.map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`text-sm font-semibold transition-colors relative py-2 ${activeTab === tab ? 'text-white' : 'text-gray-500'}`}>
                                {tab}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>}
                            </button>
                        ))}
                    </nav>
                </header>
                <main className="flex-grow overflow-y-auto p-2 no-scrollbar">
                    {activeTab === 'Galeria' ? (
                        <div className="grid grid-cols-4 gap-2">
                            {receivedGifts.map(gift => (
                                <div key={gift.name} className="relative flex flex-col items-center justify-center space-y-1 p-2 rounded-lg aspect-square">
                                    <div className="w-12 h-12 flex items-center justify-center">
                                        {gift.component ? gift.component : <span className="text-4xl">{gift.icon}</span>}
                                    </div>
                                    <div className="h-8 w-full flex items-center justify-center px-1">
                                      <p className="text-xs text-white text-center line-clamp-2">{gift.name}</p>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <span className="text-xs text-gray-400">x{gift.count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activeTab === 'Mochila' ? (
                        <div className="grid grid-cols-4 gap-2">
                            {backpackGifts.map(gift => {
                                const isSelected = selectedGift?.id === gift.id && !isEditMode;
                                return (
                                    <button 
                                        key={gift.id} 
                                        onClick={() => { if (!isEditMode) handleSelectGift(gift); }}
                                        className={`relative flex flex-col items-center justify-center space-y-1 p-2 rounded-lg aspect-square transition-all bg-transparent hover:bg-gray-800/50`}
                                    >
                                        <div className="absolute top-1 right-1 bg-purple-600 text-white text-[10px] font-bold px-1.5 rounded-full border-2 border-[#1C1C1E]">
                                            x{gift.ownedQuantity}
                                        </div>
                                        <div className="w-12 h-12 flex items-center justify-center">
                                            {gift.component ? gift.component : <span className="text-4xl">{gift.icon}</span>}
                                        </div>
                                        <div className="h-8 w-full flex items-center justify-center px-1">
                                            <p className="text-xs text-white text-center line-clamp-2">{gift.name}</p>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <span className="text-xs text-gray-400">Grátis</span>
                                        </div>
                                        {isSelected && (
                                            <div className="absolute inset-0 bg-purple-600/60 rounded-lg flex items-center justify-center border-2 border-purple-400">
                                                <CheckIcon className="w-10 h-10 text-white" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-2">
                            {filteredGifts.map(gift => {
                                const isSelected = selectedGift?.id === gift.id && !isEditMode;

                                return (
                                <button 
                                    key={gift.id} 
                                    onClick={() => {
                                        if (isEditMode) return;
                                        handleSelectGift(gift);
                                    }}
                                    draggable={isEditMode}
                                    onDragStart={() => handleDragStart(gift)}
                                    onDragEnter={() => handleDragEnter(gift)}
                                    onDragEnd={handleDrop}
                                    onDragOver={(e) => e.preventDefault()}
                                    className={`relative flex flex-col items-center justify-center space-y-1 p-2 rounded-lg aspect-square transition-all bg-transparent hover:bg-gray-800/50 ${isEditMode ? 'cursor-move is-editing' : ''}`}
                                >
                                    <div className="w-12 h-12 flex items-center justify-center relative">
                                        <div>
                                            {gift.component ? gift.component : <span className="text-4xl">{gift.icon}</span>}
                                        </div>
                                    </div>
                                    <div className={`h-8 w-full flex items-center justify-center px-1`}>
                                        <p className="text-xs text-white text-center line-clamp-2">{gift.name}</p>
                                    </div>
                                    <div className={`flex items-center space-x-1`}>
                                        <YellowDiamondIcon className="w-3 h-3 text-yellow-400" />
                                        <span className="text-xs text-yellow-400">{gift.price}</span>
                                    </div>
                                    {isSelected && (
                                        <div className="absolute inset-0 bg-purple-600/60 rounded-lg flex items-center justify-center border-2 border-purple-400">
                                            <CheckIcon className="w-10 h-10 text-white" />
                                        </div>
                                    )}
                                </button>
                                );
                            })}
                        </div>
                    )}
                </main>
                {isEditMode ? (
                     <div className="flex-shrink-0 p-4 border-t border-gray-700 text-center text-gray-400 text-sm">
                        {t('gifts.dragToReorder')}
                    </div>
                ) : (
                    <footer className="flex-shrink-0 p-3 border-t border-gray-700 flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-400">
                                {selectedGift ? t('gifts.canSend').replace('{count}', maxCanSend.toString()) : t('gifts.selectGift')}
                            </div>
                            <button 
                                onClick={handleSend} 
                                disabled={!selectedGift || quantity > maxCanSend || isSending}
                                className="bg-purple-600 text-white font-bold px-8 py-2.5 rounded-full disabled:bg-gray-600 disabled:cursor-not-allowed"
                            >
                                {isSending ? "Enviando..." : t('common.send')}
                            </button>
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                            {presetQuantities.map((q) => (
                                <button 
                                    key={q} 
                                    onClick={() => setQuantity(q)}
                                    className={`text-sm py-1 rounded-md transition-colors ${quantity === q ? 'bg-purple-500 text-white' : 'bg-[#2C2C2E] text-gray-300 hover:bg-gray-700/50'}`}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </footer>
                )}
            </div>
        </div>
    );
};

export default GiftModal;