import React, { useState, useEffect, useMemo } from 'react';
import { YellowDiamondIcon, HeadphonesIcon, PlusIcon, ChevronLeftIcon, CheckIcon } from '../icons';
import { useTranslation } from '../../i18n';
import { User, ToastType } from '../../types';
import { api } from '../../services/api';
import { LoadingSpinner } from '../Loading';
import * as FrameIcons from '../icons/frames';

interface MarketScreenProps {
  onClose: () => void;
  user: User;
  updateUser: (user: User) => void;
  onOpenWallet: (initialTab: 'Diamante' | 'Ganhos') => void;
  addToast: (type: ToastType, message: string) => void;
}

const tabs = ['Molduras', 'Carros', 'Bolhas', 'Anéis'];

const MarketScreen: React.FC<MarketScreenProps> = ({ onClose, user, updateUser, onOpenWallet, addToast }) => {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const frameComponents = useMemo(() => {
      const map: Record<string, React.FC<any>> = {};
      Object.entries(FrameIcons).forEach(([key, Component]) => {
          const id = key.replace('Icon', ''); 
          map[id] = Component;
      });
      return map;
  }, []);

  useEffect(() => {
      const fetchData = async () => {
          console.log("%c[MARKET] Iniciar renderização", "color: #A855F7; font-weight: bold");
          setIsLoading(true);
          try {
              console.log("%c[MARKET] Construir - Buscando Assets", "color: #A855F7");
              if (activeTab === 'Molduras') {
                const data = await api.getAvatarFrames();
                setItems(data || []);
                if (data && data.length > 0) setSelectedItem(data[0]);
              } else {
                setItems([]);
              }
              console.log("%c[MARKET] Fim da renderização", "color: #A855F7; font-weight: bold");
          } catch (error) { 
              console.error("Erro ao carregar loja:", error); 
              addToast(ToastType.Error, "Falha ao conectar com o banco real.");
          } finally { 
              setIsLoading(false); 
          }
      };
      fetchData();
  }, [activeTab]);

  const handleAction = async () => {
      if (!selectedItem) return;
      
      const isOwned = user.ownedFrames?.some(f => f.frameId === selectedItem.id);

      if (isOwned) {
          try {
              const result = await api.setActiveFrame(user.id, selectedItem.id);
              if (result) {
                  updateUser(result);
                  addToast(ToastType.Success, "Item equipado com sucesso!");
              }
          } catch (e) {
              addToast(ToastType.Error, "Erro ao equipar.");
          }
      } else {
          if (user.diamonds < selectedItem.price) {
              onOpenWallet('Diamante');
          } else {
              addToast(ToastType.Info, "Processando compra no Banco Mocha...");
              // Simulação de compra via API
              setTimeout(() => {
                  addToast(ToastType.Success, "Compra realizada!");
                  updateUser({
                      ...user,
                      diamonds: user.diamonds - selectedItem.price,
                      ownedFrames: [...(user.ownedFrames || []), { frameId: selectedItem.id, expirationDate: '2025-12-31' }]
                  });
              }, 1000);
          }
      }
  };

  return (
    <div className="fixed inset-0 bg-[#121212] z-[130] flex flex-col text-white font-sans animate-in slide-in-from-right duration-300">
      <header className="flex items-center justify-between p-4 pt-6 bg-[#121212] border-b border-white/5">
        <button onClick={onClose} className="p-2 -ml-2"><ChevronLeftIcon className="w-6 h-6" /></button>
        <h1 className="text-lg font-bold">Loja VIP</h1>
        <button className="bg-white/5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">Mochila</button>
      </header>

      <nav className="flex items-center space-x-6 px-6 py-4 bg-[#121212] overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`text-sm font-bold whitespace-nowrap relative ${activeTab === tab ? 'text-white' : 'text-gray-500'}`}
          >
            {tab}
            {activeTab === tab && <div className="absolute -bottom-2 left-0 right-0 h-1 bg-purple-500 rounded-full"></div>}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto p-4 bg-black/20">
        {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
                <LoadingSpinner />
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sincronizando Banco...</span>
            </div>
        ) : items.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-500">
                <p className="text-sm font-bold">Categoria em breve</p>
                <p className="text-[10px] uppercase mt-1">Disponível na próxima versão</p>
            </div>
        ) : (
            <>
                <div className="flex flex-col items-center justify-center py-8 mb-4">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                        <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover border-4 border-white/5" alt="Avatar" />
                        {selectedItem && frameComponents[selectedItem.id] && 
                            React.createElement(frameComponents[selectedItem.id], { className: "absolute inset-[-15%] w-[130%] h-[130%] pointer-events-none" })
                        }
                    </div>
                    <h2 className="mt-4 text-purple-400 font-black text-xs uppercase tracking-widest">{selectedItem?.name}</h2>
                </div>

                <div className="grid grid-cols-3 gap-3 pb-24">
                    {items.map(item => (
                        <button 
                            key={item.id} 
                            onClick={() => setSelectedItem(item)}
                            className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 transition-all border-2 ${selectedItem?.id === item.id ? 'bg-purple-600/10 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-white/5 border-transparent'}`}
                        >
                            <div className="flex-1 w-full flex items-center justify-center p-2">
                                {frameComponents[item.id] && React.createElement(frameComponents[item.id], { className: "w-full h-full" })}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                                <YellowDiamondIcon className="w-3 h-3" />
                                <span className="text-[11px] font-black">{item.price}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </>
        )}
      </main>

      <footer className="p-4 pb-8 bg-[#121212] border-t border-white/5 safe-area-bottom">
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                <YellowDiamondIcon className="w-5 h-5" />
                <span className="text-lg font-black">{user.diamonds.toLocaleString()}</span>
                <button onClick={() => onOpenWallet('Diamante')} className="bg-yellow-400 text-black rounded-full w-5 h-5 flex items-center justify-center"><PlusIcon className="w-3 h-3" /></button>
            </div>
            <button 
                onClick={handleAction}
                disabled={!selectedItem || isLoading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-50"
            >
                {user.ownedFrames?.some(f => f.frameId === selectedItem?.id) ? 'Equipar' : `Comprar (${selectedItem?.price || 0})`}
            </button>
        </div>
      </footer>
    </div>
  );
};

export default MarketScreen;