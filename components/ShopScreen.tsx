import React, { useState, useEffect } from 'react';
import { BackIcon, YellowDiamondIcon } from './icons';
import { useTranslation } from '../i18n';
import { User, ToastType } from '../types';
import { shopAPI, ShopItem, UserInventory, UserAvatar } from '../services/shopAPI';

interface ShopScreenProps {
  onClose: () => void;
  user: User;
  updateUser: (user: User) => void;
  onOpenWallet: (initialTab: 'Diamante' | 'Ganhos') => void;
  addToast: (type: ToastType, message: string) => void;
}

const ShopScreen: React.FC<ShopScreenProps> = ({ 
  onClose, 
  user, 
  updateUser, 
  onOpenWallet, 
  addToast 
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'mochilas' | 'quadros' | 'carros' | 'bolhas' | 'aneis' | 'avatars'>('mochilas');
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [userInventory, setUserInventory] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Carregar itens da loja e inventário do usuário
  useEffect(() => {
    loadShopData();
  }, [activeTab, user.id]);

  const loadShopData = async () => {
    try {
      setLoading(true);
      
      // Carregar itens da categoria ativa
      let items: ShopItem[] = [];
      switch (activeTab) {
        case 'mochilas':
          items = await shopAPI.mochilas.getAll();
          break;
        case 'quadros':
          items = await shopAPI.quadros.getAll();
          break;
        case 'carros':
          items = await shopAPI.carros.getAll();
          break;
        case 'bolhas':
          items = await shopAPI.bolhas.getAll();
          break;
        case 'aneis':
          items = await shopAPI.aneis.getAll();
          break;
        case 'avatars':
          items = await shopAPI.avatars.getAll();
          break;
      }
      
      setShopItems(items);
      
      // Carregar inventário do usuário
      const inventory = await shopAPI.getUserInventory(user.id);
      setUserInventory(inventory);
      
    } catch (error) {
      console.error('Erro ao carregar dados da loja:', error);
      addToast('error', 'Erro ao carregar itens da loja');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (itemId: string, price: number) => {
    try {
      if (user.diamonds < price) {
        addToast('error', 'Diamonds insuficientes');
        onOpenWallet('Diamante');
        return;
      }

      let result;
      switch (activeTab) {
        case 'mochilas':
          result = await shopAPI.mochilas.purchase(itemId, user.id);
          break;
        case 'quadros':
          result = await shopAPI.quadros.purchase(itemId, user.id);
          break;
        case 'carros':
          result = await shopAPI.carros.purchase(itemId, user.id);
          break;
        case 'bolhas':
          result = await shopAPI.bolhas.purchase(itemId, user.id);
          break;
        case 'aneis':
          result = await shopAPI.aneis.purchase(itemId, user.id);
          break;
        case 'avatars':
          result = await shopAPI.avatars.purchase(itemId, user.id);
          break;
      }

      if (result.success) {
        // Atualizar diamonds do usuário
        const updatedUser = { ...user, diamonds: result.userDiamonds };
        updateUser(updatedUser);
        
        // Recarregar inventário
        await loadShopData();
        
        addToast('success', 'Item comprado com sucesso!');
      }
      
    } catch (error: any) {
      console.error('Erro na compra:', error);
      addToast('error', error.message || 'Erro ao comprar item');
    }
  };

  const handleEquipAvatar = async (avatarId: string) => {
    try {
      const result = await shopAPI.avatars.equip(avatarId, user.id);
      if (result.success) {
        // Atualizar avatar do usuário
        const updatedUser = { ...user, avatarUrl: result.currentAvatar.imageUrl };
        updateUser(updatedUser);
        
        addToast('success', 'Avatar equipado com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro ao equipar avatar:', error);
      addToast('error', error.message || 'Erro ao equipar avatar');
    }
  };

  const isItemOwned = (itemId: string) => {
    const inventory = userInventory[activeTab] || [];
    return inventory.some((item: any) => item.itemId === itemId);
  };

  const isAvatarEquipped = (avatarId: string) => {
    const avatars = userInventory.avatars || [];
    return avatars.some((avatar: UserAvatar) => avatar.avatarId === avatarId && avatar.isCurrent);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR');
  };

  const getRemainingDays = (expirationDate: string) => {
    const exp = new Date(expirationDate);
    const now = new Date();
    const diffTime = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const renderShopItem = (item: ShopItem) => {
    const isOwned = isItemOwned(item.id);
    const isEquipped = activeTab === 'avatars' ? isAvatarEquipped(item.id) : false;
    
    return (
      <div key={item.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="relative">
          <img 
            src={item.image} 
            alt={item.name}
            className="w-full h-32 object-cover rounded-lg mb-3"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://via.placeholder.com/150x150/4B5563/FFFFFF?text=${encodeURIComponent(item.name)}`;
            }}
          />
          {isEquipped && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Equipado
            </div>
          )}
          {isOwned && !isEquipped && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              Possuído
            </div>
          )}
        </div>
        
        <h3 className="text-white font-semibold text-sm mb-1">{item.name}</h3>
        <p className="text-gray-400 text-xs mb-2">{item.description}</p>
        
        {item.duration && (
          <p className="text-purple-400 text-xs mb-2">
            Duração: {item.duration} dias
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <YellowDiamondIcon className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-bold text-sm">{formatPrice(item.price)}</span>
          </div>
          
          {!isOwned ? (
            <button
              onClick={() => handlePurchase(item.id, item.price)}
              disabled={user.diamonds < item.price}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                user.diamonds >= item.price
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Comprar
            </button>
          ) : (
            <>
              {activeTab === 'avatars' && !isEquipped && (
                <button
                  onClick={() => handleEquipAvatar(item.id)}
                  className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs font-semibold transition-colors"
                >
                  Equipar
                </button>
              )}
              {isEquipped && (
                <div className="px-3 py-1 bg-green-500 text-white rounded text-xs font-semibold">
                  Ativo
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'mochilas', label: 'Mochilas', icon: '🎒' },
    { id: 'quadros', label: 'Quadros', icon: '🖼️' },
    { id: 'carros', label: 'Carros', icon: '🏎️' },
    { id: 'bolhas', label: 'Bolhas', icon: '💬' },
    { id: 'aneis', label: 'Anéis', icon: '💍' },
    { id: 'avatars', label: 'Avatares', icon: '👤' },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <BackIcon className="w-5 h-5" />
            </button>
            <h2 className="text-white font-bold text-lg">Loja</h2>
          </div>
          <div className="flex items-center space-x-2">
            <YellowDiamondIcon className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-bold">{user.diamonds.toLocaleString('pt-BR')}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800 px-4 py-2 flex space-x-2 border-b border-gray-700 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">Carregando...</div>
            </div>
          ) : shopItems.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">Nenhum item disponível nesta categoria</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {shopItems.map(renderShopItem)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopScreen;
