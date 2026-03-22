import React, { useState, useEffect } from 'react';
import { BackIcon, YellowDiamondIcon, HeadphonesIcon, PlusIcon } from './icons';
import { useTranslation } from '../i18n';
import { User, ToastType } from '../types';
import { shopAPI, ShopItem, UserInventory, UserAvatar } from '../services/shopAPI';
import { api } from '../services/api';
// Importar os frames novos
import { avatarFrames, getRemainingDays } from '../utils/chatUtils';

// FIX: Add missing props to interface
interface MarketScreenProps {
  onClose: () => void;
  user: User;
  updateUser: (user: User) => void;
  onOpenWallet: (initialTab: 'Diamante' | 'Ganhos') => void;
  onPurchaseFrame: (frameId: string) => void;
  addToast: (type: ToastType, message: string) => void;
}

const tabs = ['Quadro de avatar', 'Carro', 'Bolha', 'Anel'];

const MarketScreen: React.FC<MarketScreenProps> = ({ onClose, user, updateUser, onOpenWallet, onPurchaseFrame, addToast }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [avatarFrames, setAvatarFrames] = useState<any[]>([]);
  const [isLoadingFrames, setIsLoadingFrames] = useState(true);

  // Early return if user is not available
  if (!user) {
    return (
      <div className="absolute inset-0 bg-[#212134] z-[70] flex items-center justify-center text-white">
        <div className="text-gray-400">Carregando dados do usuário...</div>
      </div>
    );
  }

  // Fetch avatar frames from API
  useEffect(() => {
    const fetchFrames = async () => {
      if (!user) return;
      
      setIsLoadingFrames(true);
      try {
        const frames = await api.getAvatarFrames();
        // Import frame components and map them
        const frameIcons = await import('./icons/frames');
        const framesWithComponents = frames.map(frame => ({
          ...frame,
          component: frameIcons[frame.id as keyof typeof frameIcons] || null
        }));
        setAvatarFrames(framesWithComponents);
      } catch (error) {
        console.error('Failed to fetch avatar frames:', error);
        setAvatarFrames([]);
      } finally {
        setIsLoadingFrames(false);
      }
    };
    fetchFrames();
  }, [user]);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Set initial selected item after frames are loaded
  useEffect(() => {
    if (avatarFrames.length > 0) {
      const activeFrame = avatarFrames.find(f => 
        f.id === (user as any).activeFrameId && 
        getRemainingDays(((user as any).ownedFrames || []).find((owned: any) => owned.frameId === f.id)?.expirationDate) > 0
      );
      setSelectedItem(activeFrame || avatarFrames[0]);
    }
  }, [avatarFrames, user]);

  const handlePurchase = async () => {
    if (!selectedItem || isActionLoading) return;
    
    // Verificar se já possui o frame antes de tentar comprar
    if (isFrameOwned) {
      addToast(ToastType.Error, 'Você já possui este frame');
      return;
    }
    
    setIsActionLoading(true);

    try {
      const response = await api.buyFrame(user.id, selectedItem.id, selectedItem.price, selectedItem.duration);
      if (response.success) {
        // Atualizar dados do usuário com os frames
        const updatedUser = { ...user, ...response.user };
        if (updatedUser) {
          updateUser(updatedUser);
          addToast(ToastType.Success, 'Quadro comprado com sucesso!');
        }
      }
    } catch (error: any) {
      addToast(ToastType.Error, error.message || 'Erro ao comprar quadro');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEquipFrame = async (frameId: string | null) => {
    setIsActionLoading(true);
    try {
      const response = await api.equipFrame(user.id, frameId);
      if (response.success) {
        updateUser(response.user);
        addToast(ToastType.Success, frameId ? 'Moldura equipada!' : 'Moldura desequipada.');
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const SelectedFrameComponent = selectedItem ? (selectedItem as any).component : null;
  const isFrameOwned = selectedItem && ((user as any).ownedFrames || []).some((f: any) => f.frameId === selectedItem.id && getRemainingDays(f.expirationDate) > 0);
  const isSelectedFrameEquipped = isFrameOwned && selectedItem && (user as any).activeFrameId === selectedItem.id;
  const selectedOwnedFrame = selectedItem && ((user as any).ownedFrames || []).find((f: any) => f.frameId === selectedItem.id);
  const remainingDays = getRemainingDays(selectedOwnedFrame?.expirationDate);

  let buttonText: string = '';
  let buttonAction: (() => void) | undefined = undefined;
  let buttonDisabled: boolean = isActionLoading;
  let buttonClass = 'bg-green-500 hover:bg-green-600';

  if (activeTab === 'Quadro de avatar') {
    if (isSelectedFrameEquipped) {
      buttonText = `Desequipar`;
      buttonAction = () => handleEquipFrame(null);
      buttonClass = 'bg-gray-600 hover:bg-gray-700';
    } else if (isFrameOwned) {
      buttonText = 'Equipar';
      buttonAction = () => handleEquipFrame(selectedItem?.id);
      buttonClass = 'bg-blue-500 hover:bg-blue-700';
    } else { // Not owned
      if (selectedItem && user.diamonds < selectedItem.price) {
        buttonText = 'Recarregar';
        buttonAction = () => onOpenWallet('Diamante');
        buttonClass = 'bg-yellow-500 hover:bg-yellow-600';
        buttonDisabled = false;
      } else {
        buttonText = `Comprar (${selectedItem?.price || 0})`;
        buttonAction = handlePurchase;
      }
    }
  }

  return (
    <div className="absolute inset-0 bg-[#212134] z-[70] flex flex-col text-white font-sans">
      <div className="twinkle-bg"></div>
      <header className="relative flex items-center justify-between p-3 flex-shrink-0 z-10">
        <button onClick={onClose} className="p-2 -ml-2">
          <BackIcon className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">Loja</h1>
        <button className="bg-black/30 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1.5">
          <HeadphonesIcon className="w-4 h-4" />
          <span>Mochila</span>
        </button>
      </header>

      <nav className="px-4 flex-shrink-0 z-10">
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors flex-shrink-0 ${activeTab === tab ? 'bg-white text-black' : 'bg-white/10 text-gray-300'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      <main className="overflow-y-auto no-scrollbar p-4 z-10 flex flex-col flex-grow">
        {activeTab === 'Quadro de avatar' ? (
          <>
            {/* Preview Section */}
            <div className="flex-shrink-0 mb-4 flex flex-col items-center justify-center h-40">
              <div className="relative w-24 h-24">
                {user.avatarUrl && user.avatarUrl.trim() ? (
                  <img src={user.avatarUrl} alt="User Avatar" className="w-full h-full object-cover rounded-full" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" fill="#4B5563"/></svg>'); }} />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-600 flex items-center justify-center text-white text-3xl font-bold">{user.name?.[0] || '?'}</div>
                )}
                {SelectedFrameComponent && (
                  <div className="absolute -top-4 -left-4 w-32 h-32 pointer-events-none avatar-frame-glow-effect">
                    <SelectedFrameComponent className="w-full h-full" />
                  </div>
                )}
              </div>
              {isFrameOwned ? (
                <div className="mt-4 text-sm text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full">
                  Válido por 7 dias
                </div>
              ) : selectedItem ? (
                <div className="mt-4 text-sm text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full">
                  Válido por 7 dias
                </div>
              ) : null}
            </div>

            {/* Item Grid */}
            {isLoadingFrames ? (
              <div className="flex items-center justify-center h-40">
                <div className="text-gray-400">Carregando...</div>
              </div>
            ) : avatarFrames.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <div className="text-gray-500">Nenhum frame disponível no momento.</div>
              </div>
            ) : !selectedItem ? (
              <div className="flex items-center justify-center h-40">
                <div className="text-gray-500">Selecione um frame para continuar.</div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {avatarFrames.map(frame => {
                  const isOwned = ((user as any).ownedFrames || []).some((f: any) => f.frameId === frame.id && getRemainingDays(f.expirationDate) > 0);
                  const isEquipped = isOwned && (user as any).activeFrameId === frame.id;
                  return (
                    <button
                      key={frame.id}
                      onClick={() => setSelectedItem(frame as any)}
                      className={`relative aspect-square bg-black/20 rounded-lg flex items-center justify-center p-1 transition-all duration-200 ${selectedItem?.id === frame.id ? 'ring-2 ring-purple-400' : 'ring-2 ring-transparent'}`}
                    >
                      <div className="w-full h-full">
                        {frame.component ? (
                          <frame.component className="w-full h-full" />
                        ) : (
                          <div className="w-full h-full bg-gray-600 rounded flex items-center justify-center text-gray-400 text-xs">
                            Frame
                          </div>
                        )}
                      </div>
                      {isEquipped ? (
                        <div className="absolute top-1 right-1 bg-purple-600 text-white text-[9px] font-bold px-1.5 rounded-full">Equipado</div>
                      ) : isOwned && (
                        <div className="absolute top-1 right-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 rounded-full">Adquirido</div>
                      )}
                      <div className="absolute bottom-1 right-1 flex items-center space-x-1 bg-black/50 rounded-full px-1.5 py-0.5">
                        <YellowDiamondIcon className="w-3 h-3 text-yellow-400" />
                        <span className="text-white text-[10px] font-semibold">{frame.price}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center h-full">
            <p className="text-gray-500">Em breve...</p>
          </div>
        )}
      </main>

      {activeTab === 'Quadro de avatar' && (
        <footer className="flex-shrink-0 p-4 z-10 border-t border-white/10 bg-[#212134]/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <YellowDiamondIcon className="w-6 h-6 text-yellow-400" />
              <span className="text-lg font-bold text-white">{user.diamonds > 0 ? user.diamonds.toLocaleString('pt-BR') : '0'}</span>
              <button onClick={() => onOpenWallet('Diamante')} className="bg-yellow-400/20 w-6 h-6 rounded-full flex items-center justify-center">
                <PlusIcon className="w-4 h-4 text-yellow-300" />
              </button>
            </div>
            <button
              onClick={buttonAction}
              disabled={buttonDisabled}
              className={`text-white font-bold px-10 py-3 rounded-full transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed ${buttonClass}`}
            >
              {isActionLoading ? 'Processando...' : buttonText}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
};

export default MarketScreen;
