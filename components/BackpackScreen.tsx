
import React, { useState, useEffect, useMemo } from 'react';
import type { User, InventoryItem, InventoryCategory, AppView } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import GiftBasketIcon from './icons/GiftBasketIcon';
import FrameIcon from './icons/FrameIcon';
import BackpackIcon from './icons/BackpackIcon';

interface BackpackScreenProps {
  user: User;
  onExit: () => void;
  onUpdateUser: (user: User) => void;
  onNavigate: (view: AppView) => void;
}

const ItemCard: React.FC<{
  item: InventoryItem;
  isEquipped: boolean;
  onEquip: (itemId: string) => void;
}> = ({ item, isEquipped, onEquip }) => {
  const canBeEquipped = item.sub_type === 'entry_effect';

  return (
    <div className="bg-[#2A2D32] p-3 rounded-xl flex flex-col items-center text-center justify-between">
      <div>
        <div className="w-20 h-20 flex items-center justify-center mb-2">
          <img src={item.imageUrl} alt={item.name} className="max-w-full max-h-full object-contain" />
        </div>
        <p className="font-semibold text-white text-sm">{item.name}</p>
        <p className="text-gray-400 text-xs">x{item.quantity}</p>
        <p className="text-gray-400 text-xs mt-2 h-8 line-clamp-2">{item.description}</p>
      </div>
      {canBeEquipped ? (
        <button
          onClick={() => onEquip(item.id)}
          className={`w-full mt-2 py-1.5 rounded-md text-xs font-semibold transition-colors ${
            isEquipped ? 'bg-red-500 text-white' : 'bg-green-500 text-black'
          }`}
        >
          {isEquipped ? 'Desequipar' : 'Equipar'}
        </button>
      ) : <div className="h-[28px] mt-2"></div> /* Spacer */}
    </div>
  );
};

const BackpackScreen: React.FC<BackpackScreenProps> = ({ user, onExit, onUpdateUser, onNavigate }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<InventoryCategory>('decoration');

  useEffect(() => {
    const fetchInventory = async () => {
      setIsLoading(true);
      try {
        const items = await liveStreamService.getUserInventory(user.id);
        setInventory(items);
      } catch (error) {
        console.error("Failed to fetch inventory:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInventory();
  }, [user.id]);

  const filteredItems = useMemo(() => {
    return inventory.filter(item => item.category === activeTab);
  }, [inventory, activeTab]);

  const handleEquipItem = async (itemId: string) => {
    try {
      const updatedUser = await liveStreamService.equipItem(user.id, itemId);
      onUpdateUser(updatedUser);
    } catch (error) {
      console.error("Failed to equip item:", error);
      alert("Não foi possível equipar o item.");
    }
  };

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
      <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-800">
        <button onClick={onExit}><ArrowLeftIcon className="w-6 h-6" /></button>
        <h1 className="font-bold text-lg">Minha Mochila</h1>
        <div className="w-6 h-6"></div>
      </header>

      <nav className="shrink-0 flex border-b border-gray-800">
        <button 
            onClick={() => setActiveTab('gift')}
            className={`flex-1 py-3 text-center font-semibold flex items-center justify-center gap-2 ${activeTab === 'gift' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400'}`}
        >
            <GiftBasketIcon className="w-5 h-5" /> Presentes
        </button>
        <button 
            onClick={() => setActiveTab('decoration')}
            className={`flex-1 py-3 text-center font-semibold flex items-center justify-center gap-2 ${activeTab === 'decoration' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400'}`}
        >
            <FrameIcon className="w-5 h-5" /> Decorações
        </button>
      </nav>

      <main className="flex-grow p-4 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {filteredItems.map(item => (
              <ItemCard 
                key={item.id} 
                item={item}
                isEquipped={user.equipped_entry_effect_id === item.id}
                onEquip={handleEquipItem}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <BackpackIcon className="w-16 h-16 mb-4" />
            <h2 className="text-xl font-semibold">Mochila Vazia</h2>
            <p className="mt-2">Você não possui itens nesta categoria.</p>
          </div>
        )}
      </main>
      <footer className="p-4 shrink-0 border-t border-gray-800">
        <button
          onClick={() => onNavigate('diamond-purchase')}
          className="w-full bg-green-500 text-black font-bold py-3 rounded-full text-lg transition-transform hover:scale-105"
        >
          Obter mais itens
        </button>
      </footer>
      <style>{`
        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }
      `}</style>
    </div>
  );
};

export default BackpackScreen;
