import React, { useState, useEffect } from 'react';
import type { User, Gift } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import DiamondIcon from './icons/DiamondIcon';

interface GiftPanelProps {
  user: User;
  liveId: number;
  onClose: () => void;
  onSendGift: (giftId: number) => void;
  onRechargeClick: () => void;
}

const GiftPanel: React.FC<GiftPanelProps> = ({ user, liveId, onClose, onSendGift, onRechargeClick }) => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGiftId, setSelectedGiftId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGifts = async () => {
      setIsLoading(true);
      try {
        const giftCatalog = await liveStreamService.getGiftCatalog();
        setGifts(giftCatalog);
      } catch (error) {
        console.error("Failed to load gift catalog:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGifts();
  }, []);

  const selectedGift = gifts.find(g => g.id === selectedGiftId);

  const handleSend = () => {
      if (selectedGift) {
          onSendGift(selectedGift.id);
      }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-end"
      onClick={onClose}
    >
      <div 
        className="bg-[#212124]/90 backdrop-blur-md w-full rounded-t-2xl flex flex-col text-white animate-slide-up-fast"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 grid grid-cols-4 gap-4 overflow-y-auto max-h-[40vh]">
            {isLoading ? (
                 <div className="col-span-4 text-center py-8 text-gray-400">Carregando presentes...</div>
            ) : (
                gifts.map(gift => (
                    <button 
                        key={gift.id} 
                        onClick={() => setSelectedGiftId(gift.id)}
                        className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-all ${selectedGiftId === gift.id ? 'bg-white/20 scale-105' : 'bg-black/20'}`}
                    >
                        <img src={gift.imageUrl} alt={gift.name} className="w-12 h-12" />
                        <span className="text-xs">{gift.name}</span>
                        <div className="flex items-center gap-1 text-xs text-yellow-400">
                            <DiamondIcon className="w-3 h-3"/>
                            <span>{gift.price}</span>
                        </div>
                    </button>
                ))
            )}
        </div>

        <footer className="p-3 border-t border-white/10 flex items-center justify-between">
            <button onClick={onRechargeClick} className="flex items-center gap-2">
                <DiamondIcon className="w-5 h-5"/>
                <span className="font-bold text-lg">{user.wallet_diamonds.toLocaleString()}</span>
                 <span className="text-gray-400 font-semibold text-lg ml-1">&gt;</span>
            </button>
            <button 
                onClick={handleSend}
                disabled={!selectedGift}
                className="bg-green-500 text-black font-bold px-8 py-2.5 rounded-full disabled:bg-gray-600 disabled:text-gray-400 transition-colors"
            >
                Enviar
            </button>
        </footer>
      </div>
       <style>{`
        @keyframes slide-up-fast { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up-fast { animation: slide-up-fast 0.25s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default GiftPanel;