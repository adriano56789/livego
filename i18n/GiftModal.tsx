import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Gift, User } from '../../types';
import { YellowDiamondIcon, CheckIcon, LockIcon } from '../icons';
import { useTranslation } from '../../i18n';

interface GiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    userDiamonds: number;
    onSendGift: (gift: Gift, quantity: number) => void;
    onRecharge: () => void;
    gifts: Gift[];
    receivedGifts: (Gift & { count: number })[];
    isBroadcaster?: boolean;
    isSendingGift?: boolean;
}

const GiftModal: React.FC<GiftModalProps> = ({ isOpen, onClose, userDiamonds, onSendGift, onRecharge, gifts, receivedGifts, isBroadcaster = false, isSendingGift = false }) => {
    const { t } = useTranslation();
    const [isEditMode, setIsEditMode] = useState(false);
    const [giftsByTab, setGiftsByTab] = useState<Record<string, Gift[]>>({});

    const dragItem = useRef<Gift | null>(null);
    const dragOverItem = useRef<Gift | null>(null);

    useEffect(() => {
        const groupedGifts = gifts.reduce((acc, gift) => {
            const category = gift.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(gift);
            return acc;
        }, {} as Record<string, Gift[]>);
        setGiftsByTab(groupedGifts);
    }, [gifts]);

    const giftCategories = useMemo(() => {
        const categories: (Gift['category'] | 'Galeria')[] = ['Popular', 'Luxo', 'Atividade', 'VIP', 'Efeito', 'Entrada', 'Galeria'];
        return categories.filter(c => c !== 'VIP');
    }, []);

    const [activeTab, setActiveTab] = useState<(Gift['category'] | 'Galeria')>(giftCategories[0]);
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

    const filteredGifts = useMemo(() => {
        if (activeTab === 'Galeria') return [];
        return giftsByTab[activeTab as string] || [];
    }, [activeTab, giftsByTab]);
    
    const maxCanSend = useMemo(() => {
        if (!selectedGift || !selectedGift.price || selectedGift.price === 0) return 0;
        return Math.floor(userDiamonds / selectedGift.price);
    }, [selectedGift, userDiamonds]);

    const handleSend = () => {
        if (isEditMode || !selectedGift || isSendingGift) {
            return;
        }

        if (quantity > 0 && quantity * (selectedGift.price || 0) <= userDiamonds) {
            onSendGift(selectedGift, quantity);
            setSelectedGift(null);
            setQuantity(1);
            onClose();
        } else {
            onRecharge();
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
        const dragItemIndex = currentGifts.findIndex(g => g.name === dragItem.current!.name);
        const dragOverItemIndex = currentGifts.findIndex(g => g.name === dragOverItem.current!.name);
    
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

        dragItem.current = null;
        dragOverItem.current = null;
    };

    return (
        <div 
            className={`absolute inset-0 z-30 flex items-end ${isOpen ? '' : 'pointer-events-none'}`} 
            onClick={onClose}
        >
            <div 
                className={`bg-[#1C1C1E] w-full max-w-md h-[60%] rounded-t-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`} 
                onClick={e => e.stopPropagation()}
            >
                <header className="flex-shrink-0 p-3">
                    <div className="flex justify-between items-center mb-2 relative text-center h-9">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2">
                            {canReorderCurrentTab && (
                                <button 
                                    onClick={() => setIsEditMode(!isEditMode)} 
                                    className="text-sm font-semibold text-purple-400 px-3 py-1 rounded-full bg-purple-500/10 hover:bg-purple-500/20"
                                >
                                    {isEditMode ? t('gifts.done') : t('gifts.reorder')}
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
                    <nav className="flex items-center space-x-4 border-b border-gray-700">
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
                    ) : (
                        <div className="grid grid-cols-4 gap-2">
                            {filteredGifts.map(gift => {
                                const isSelected = selectedGift?.name === gift.name && !isEditMode;

                                return (
                                <button 
                                    key={gift.name} 
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
                                {selectedGift ? t('gifts.canSend', { count: maxCanSend }) : t('gifts.selectGift')}
                            </div>
                            <button 
                                onClick={handleSend} 
                                disabled={!selectedGift || (selectedGift.price || 0) * quantity > userDiamonds || isSendingGift}
                                className="bg-purple-600 text-white font-bold px-8 py-2.5 rounded-full disabled:bg-gray-600 disabled:cursor-not-allowed"
                            >
                                {isSendingGift ? "Enviando..." : t('common.send')}
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