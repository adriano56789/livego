import React, { useState, useEffect } from 'react';
import { BackIcon, MenuIcon, GoldCoinWithGIcon } from './icons';
import GanhosTab from './GanhosTab';
import PurchaseHistoryScreen from './PurchaseHistoryScreen';
import ConfigureWithdrawalMethodScreen from './ConfigureWithdrawalMethodScreen';
import { useTranslation } from '../i18n';
import { User, ToastType, PurchaseRecord } from '../types';
import DiamanteDisplay from './DiamanteDisplay';
import { api } from '../services/api';

interface WalletScreenProps {
  onClose: () => void;
  onPurchase: (pkg: { diamonds: number; price: number }) => void;
  initialTab?: 'Diamante' | 'Ganhos';
  isBroadcaster?: boolean;
  currentUser: User;
  updateUser: (user: User) => void;
  addToast: (type: ToastType, message: string) => void;
  purchaseHistory: PurchaseRecord[];
}

const diamondPackages = [
  { diamonds: 800, price: 7.00 },
  { diamonds: 3000, price: 25.00 },
  { diamonds: 6000, price: 60.00 },
  { diamonds: 20000, price: 180.00 },
  { diamonds: 36000, price: 350.00 },
  { diamonds: 65000, price: 600.00 },
];

const DiamanteTab: React.FC<{ onPurchase: (pkg: { diamonds: number; price: number }) => void; currentUser: User; }> = ({ onPurchase, currentUser }) => {
  const { t } = useTranslation();
  const [freshDiamonds, setFreshDiamonds] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchFreshData = async () => {
      if (!currentUser?.id) return;

      setIsLoading(true);
      try {
        const freshUser = await api.getFreshUserData(currentUser.id);
        
        if (freshUser && typeof freshUser.diamonds === 'number') {
          setFreshDiamonds(freshUser.diamonds);
        } else {
          // Se API falhar, usar o valor do currentUser sem forçar 0
          if (currentUser.diamonds !== undefined && currentUser.diamonds !== null) {
            setFreshDiamonds(currentUser.diamonds);
          }
        }
      } catch (error) {
        // Se der erro, usar o valor do currentUser sem forçar 0
        if (currentUser.diamonds !== undefined && currentUser.diamonds !== null) {
          setFreshDiamonds(currentUser.diamonds);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchFreshData();
  }, [currentUser?.id]);

  // NÃO USAR || 0 - isso zera o contador!
  const displayDiamonds = freshDiamonds !== null ? freshDiamonds : (currentUser.diamonds ?? 0);
  
  return (
    <>
      <DiamanteDisplay diamonds={displayDiamonds} />
      {isLoading && (
        <div className="text-center text-gray-400 text-sm mb-2">
          Atualizando dados...
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {diamondPackages.map((pkg) => (
          <div key={pkg.diamonds} onClick={() => onPurchase(pkg)} className="bg-[#2C2C2E] rounded-lg p-4 flex flex-col items-center justify-center space-y-3 cursor-pointer hover:bg-gray-700 transition-colors">
            <div className="flex items-center space-x-2">
              <GoldCoinWithGIcon className="w-5 h-5" />
              <span className="text-white font-bold text-lg">
                {pkg.diamonds.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="bg-[#444444] rounded-md px-4 py-1.5 text-sm text-gray-200">
              R$ {pkg.price.toFixed(2).replace('.', ',')}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

type WalletView = 'main' | 'history' | 'configure_withdrawal';

const WalletScreen: React.FC<WalletScreenProps> = ({ onClose, onPurchase, initialTab, isBroadcaster, currentUser, updateUser, addToast, purchaseHistory }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(initialTab || 'Diamante');
  const [view, setView] = useState<WalletView>('main');

  if (view === 'history') {
    return <PurchaseHistoryScreen onClose={() => setView('main')} history={purchaseHistory} />;
  }
  
  if (view === 'configure_withdrawal') {
    return <ConfigureWithdrawalMethodScreen onClose={() => setView('main')} currentUser={currentUser} updateUser={updateUser} addToast={addToast} />;
  }

  return (
    <div className="absolute inset-0 bg-[#111111] z-50 flex flex-col text-white">
      <header className="flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0">
        <button onClick={onClose}>
          <BackIcon className="w-6 h-6" />
        </button>
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setActiveTab('Diamante')}
            className={`text-lg font-semibold relative pb-1 ${activeTab === 'Diamante' ? 'text-white' : 'text-gray-500'}`}
          >
            {t('wallet.diamond')}
            {activeTab === 'Diamante' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>}
          </button>
          {isBroadcaster && (
            <button
                onClick={() => setActiveTab('Ganhos')}
                className={`text-lg font-semibold relative pb-1 ${activeTab === 'Ganhos' ? 'text-white' : 'text-gray-500'}`}
            >
                {t('wallet.earnings')}
                {activeTab === 'Ganhos' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>}
            </button>
          )}
        </div>
        <button onClick={() => setView('history')}>
          <MenuIcon className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-grow overflow-y-auto p-4 space-y-4">
        {activeTab === 'Diamante' && <DiamanteTab onPurchase={onPurchase} currentUser={currentUser} />}
        {isBroadcaster && activeTab === 'Ganhos' && <GanhosTab onConfigure={() => setView('configure_withdrawal')} currentUser={currentUser} updateUser={updateUser} addToast={addToast} />}
      </main>
    </div>
  );
};

export default WalletScreen;