import React, { useState } from 'react';
import { BackIcon, YellowDiamondIcon, HeadphonesIcon, PlusIcon } from './icons';
import { useTranslation } from '../i18n';
import { User, ToastType, Gift } from '../types';
import { avatarFrames, getRemainingDays } from '../services/database';
import { api } from '../services/api';

interface MarketScreenProps {
  onClose: () => void;
  user: User;
  updateUser: (user: User) => void;
  onOpenWallet: (initialTab: 'Diamante' | 'Ganhos') => void;
  onPurchaseFrame: (frameId: string) => void;
  addToast: (type: ToastType, message: string) => void;
  onOpenVIPCenter: () => void;
  onPurchaseEffect: (gift: Gift) => Promise<void>;
  gifts: Gift[];
}

const tabs = ['Quadro de avatar', 'Carro', 'Bolha', 'Anel'];

const MarketScreen: React.FC<MarketScreenProps> = ({ onClose, user, updateUser, onOpenWallet, onPurchaseFrame, addToast, onOpenVIPCenter, onPurchaseEffect, gifts }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(tabs[0]);
  
  const initialSelectedItem = avatarFrames.find(f => f.id === user.activeFrameId && getRemainingDays(user.ownedFrames.find(owned => owned.frameId === f.id)?.expirationDate) > 0) || avatarFrames[0];
  
  const [selectedItem, setSelectedItem] = useState(initialSelectedItem);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handlePurchase = async () => {
    if (!selectedItem || isActionLoading) return;
    setIsActionLoading(true);
    await onPurchaseFrame(selectedItem.id);
    setIsActionLoading(false);
  };

  const handleEquipFrame = async (frameId: string | null) => {
    setIsActionLoading(true);
    try {
      const { success, user: updatedUser } = await api.setActiveFrame(user.id, frameId);
      if (success && updatedUser) {
        updateUser(updatedUser);
        addToast(ToastType.Success, frameId ? 'Moldura equipada!' : 'Moldura desequipada.');
      } else {
        throw new Error('Falha ao alterar moldura.');
      }
    } catch (error) {
      addToast(ToastType.Error, (error as Error).message);
    } finally {
      setIsActionLoading(false);
    }
  };
  
  const SelectedFrameComponent = selectedItem ? (selectedItem as any).component : null;
  const isFrameOwned = user.ownedFrames.some(f => f.frameId === selectedItem.id && getRemainingDays(f.expirationDate) > 0);
  const isSelectedFrameEquipped = isFrameOwned && user.activeFrameId === selectedItem.id;
  const selectedOwnedFrame = user.ownedFrames.find(f => f.frameId === selectedItem.id);
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
        buttonAction = () => handleEquipFrame(selectedItem.id);
        buttonClass = 'bg-blue-500 hover:bg-blue-700';
    } else { // Not owned
        if (user.diamonds < selectedItem.price) {
            buttonText = 'Recarregar';
            buttonAction = () => onOpenWallet('Diamante');
            buttonClass = 'bg-yellow-500 hover:bg-yellow-600';
            buttonDisabled = false;
        } else {
            buttonText = `Comprar (${selectedItem.price})`;
            buttonAction = handlePurchase;
        }
    }
  }
  
  return (
    <div className="absolute inset-0 bg-[#212134] z-50 flex flex-col text-white font-sans">
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
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors flex-shrink-0 ${
                activeTab === tab ? 'bg-white text-black' : 'bg-white/10 text-gray-300'
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
                        <img src={user.avatarUrl} alt="User Avatar" className="w-full h-full object-cover rounded-full" />
                        {SelectedFrameComponent && (
                            <div className="absolute -top-4 -left-4 w-32 h-32 pointer-events-none avatar-frame-glow-effect">
                                <SelectedFrameComponent />
                            </div>
                        )}
                    </div>
                    {isFrameOwned ? (
                        <div className="mt-4 text-sm text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full">
                            Válido por {remainingDays} dia(s)
                        </div>
                    ) : (selectedItem as any).duration ? (
                        <div className="mt-4 text-sm text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full">
                            Válido por {(selectedItem as any).duration} dia(s)
                        </div>
                    ) : null}
                </div>
                
                {/* Item Grid */}
                <div className="grid grid-cols-3 gap-3">
                    {avatarFrames.map(frame => {
                        const isOwned = user.ownedFrames.some(f => f.frameId === frame.id && getRemainingDays(f.expirationDate) > 0);
                        const isEquipped = isOwned && user.activeFrameId === frame.id;
                        return (
                            <button 
                                key={frame.id}
                                onClick={() => setSelectedItem(frame as any)}
                                className={`relative aspect-square bg-black/20 rounded-lg flex items-center justify-center p-1 transition-all duration-200 ${selectedItem.id === frame.id ? 'ring-2 ring-purple-400' : 'ring-2 ring-transparent'}`}
                            >
                                <div className="w-full h-full">
                                    <frame.component />
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