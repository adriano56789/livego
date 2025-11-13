
import React, { useMemo } from 'react';
import { BackIcon, YellowDiamondIcon, GoldCoinWithGIcon, BankIcon } from './icons';
import { useTranslation } from '../i18n';
import { PurchaseRecord } from '../types';
import { LoadingSpinner } from './Loading';

interface PurchaseHistoryScreenProps {
  onClose: () => void;
  history: PurchaseRecord[];
}

type FilterType = 'all' | 'Concluído' | 'Pendente' | 'Cancelado';

const StatusBadge: React.FC<{ status: PurchaseRecord['status'] }> = ({ status }) => {
    const config = {
        'Concluído': 'bg-green-500/20 text-green-400',
        'Pendente': 'bg-yellow-500/20 text-yellow-400',
        'Cancelado': 'bg-red-500/20 text-red-400',
    }[status];

    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${config}`}>{status}</span>;
};

const HistoryItem: React.FC<{ item: PurchaseRecord }> = ({ item }) => {
    const isPurchase = item.type === 'purchase_diamonds';
    const isPlatformWithdrawal = item.type === 'withdraw_platform_earnings';
    
    const getIcon = () => {
        if (item.type === 'purchase_diamonds') return <YellowDiamondIcon className="w-6 h-6 text-yellow-400" />;
        if (item.type === 'purchase_frame') return <YellowDiamondIcon className="w-6 h-6 text-purple-400" />;
        if (isPlatformWithdrawal) return <BankIcon className="w-6 h-6 text-amber-300" />;
        return <GoldCoinWithGIcon className="w-6 h-6" />;
    };
    
    const getAmountDisplay = () => {
        if (item.type === 'purchase_frame') {
            return (
                <span className="font-bold text-lg text-red-400 flex items-center">
                    - {item.amountCoins.toLocaleString('pt-BR')}
                    <YellowDiamondIcon className="w-4 h-4 text-yellow-400 ml-1" />
                </span>
            );
        }
        if (isPurchase) {
             return <span className="font-bold text-lg text-green-400">+ R$ {item.amountBRL.toFixed(2).replace('.', ',')}</span>;
        }
        return <span className="font-bold text-lg text-green-400">+ R$ {item.amountBRL.toFixed(2).replace('.', ',')}</span>;
    };

    return (
        <div className="bg-[#1C1C1E] p-4 rounded-lg">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    {getIcon()}
                    <span className="font-semibold text-white">{item.description}</span>
                </div>
                <span className="text-sm text-gray-400">{new Date(item.timestamp).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-end mt-2">
                <StatusBadge status={item.status} />
                {getAmountDisplay()}
            </div>
        </div>
    );
};

const PurchaseHistoryScreen: React.FC<PurchaseHistoryScreenProps> = ({ onClose, history }) => {
  const { t } = useTranslation();
  const [filter, setFilter] = React.useState<FilterType>('all');

  const filteredHistory = useMemo(() => {
    if (filter === 'all') return history;
    return history.filter(item => item.status === filter);
  }, [history, filter]);
  
  const TabButton: React.FC<{ label: string; type: FilterType }> = ({ label, type }) => {
    const isActive = filter === type;
    return (
      <button
        onClick={() => setFilter(type)}
        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
          isActive ? 'bg-purple-600 text-white' : 'bg-[#2C2C2E] text-gray-300 hover:bg-gray-700'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="absolute inset-0 bg-[#111111] z-50 flex flex-col text-white">
      <header className="flex items-center p-4 border-b border-gray-800 flex-shrink-0">
        <button onClick={onClose} className="absolute">
          <BackIcon className="w-6 h-6" />
        </button>
        <div className="flex-grow text-center">
          <h1 className="text-lg font-semibold">{t('wallet.history')}</h1>
        </div>
      </header>

      <main className="flex-grow p-4 flex flex-col">
        <div className="flex-shrink-0 mb-4 flex items-center justify-center space-x-2 sm:space-x-3">
            <TabButton label="Todos" type="all" />
            <TabButton label="Concluído" type="Concluído" />
            <TabButton label="Pendente" type="Pendente" />
            <TabButton label="Cancelado" type="Cancelado" />
        </div>
        
        {filteredHistory.length === 0 ? (
            <div className="flex-grow flex items-center justify-center text-center">
                <p className="text-gray-500">{t('wallet.noHistory')}</p>
            </div>
        ) : (
            <div className="flex-grow overflow-y-auto no-scrollbar space-y-3">
                {filteredHistory.map(item => <HistoryItem key={item.id} item={item} />)}
            </div>
        )}
      </main>
    </div>
  );
};

export default PurchaseHistoryScreen;