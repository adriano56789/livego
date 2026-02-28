import React from 'react';
import { BackIcon, YellowDiamondIcon } from './icons';
import { useTranslation } from '../i18n';
import { User, Gift } from '../types';

interface MarketScreenProps {
  onClose: () => void;
  user: User;
  onOpenVIPCenter: () => void;
  onPurchaseEffect: (gift: Gift) => void;
  gifts: Gift[];
}

const MarketScreen: React.FC<MarketScreenProps> = ({ onClose, user, onOpenVIPCenter, onPurchaseEffect, gifts }) => {
  const { t } = useTranslation();
  const effectGifts = gifts.filter(g => g.category === 'Efeito');

  const handlePurchase = (gift: Gift) => {
    onPurchaseEffect(gift);
  };

  return (
    <div className="absolute inset-0 bg-[#111] z-50 flex flex-col text-white">
      <header className="flex items-center p-4 flex-shrink-0 border-b border-gray-800">
        <button onClick={onClose} className="absolute"><BackIcon className="w-6 h-6" /></button>
        <div className="flex-grow text-center"><h1 className="text-xl font-bold">{t('profile.menu.market')}</h1></div>
      </header>
      <main className="flex-grow overflow-y-auto no-scrollbar p-4">
        {user.isVIP ? (
          <div className="grid grid-cols-2 gap-4">
            {effectGifts.map((gift) => (
              <div key={gift.name} className="bg-[#1c1c1e] rounded-lg p-4 flex flex-col items-center text-center space-y-2">
                <div className="w-20 h-20 flex items-center justify-center">
                    {gift.component ? gift.component : <span className="text-6xl">{gift.icon}</span>}
                </div>
                <p className="font-semibold text-white">{gift.name}</p>
                <div className="flex items-center space-x-1">
                  <YellowDiamondIcon className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">{gift.price?.toLocaleString('pt-BR')}</span>
                </div>
                <button 
                  onClick={() => handlePurchase(gift)}
                  className="w-full bg-purple-600 text-white font-bold py-2 rounded-full hover:bg-purple-700 transition-colors mt-2"
                >
                  {t('vip.store.buy')}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">{t('vip.store.exclusiveTitle')}</h2>
            <p className="text-gray-400 mb-6 max-w-xs">{t('vip.store.exclusiveBody')}</p>
            <button 
              onClick={onOpenVIPCenter}
              className="bg-yellow-500 text-black font-bold px-8 py-3 rounded-full hover:bg-yellow-600 transition-colors"
            >
              {t('vip.store.subscribeButton')}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default MarketScreen;
