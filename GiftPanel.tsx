import React, { useState, useEffect } from 'react';
import type { User, Gift, PkBattleStreamer } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import DiamondIcon from './icons/DiamondIcon';
import { Player } from '@lottiefiles/react-lottie-player';
import GiftIcon from './icons/GiftIcon';

interface GiftPanelProps {
  user: User;
  liveId: number;
  onClose: () => void;
  onSendGift: (giftId: number, receiverId?: number) => void;
  onRechargeClick: () => void;
  pkBattleStreamers?: {
    streamer1: PkBattleStreamer;
    streamer2: PkBattleStreamer;
  };
}

const GiftPanel: React.FC<GiftPanelProps> = ({ user, liveId, onClose, onSendGift, onRechargeClick, pkBattleStreamers }) => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGiftId, setSelectedGiftId] = useState<number | null>(null);
  const [selectedReceiverId, setSelectedReceiverId] = useState<number | null>(pkBattleStreamers ? null : user.id);
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
      onSendGift(selectedGift.id, selectedReceiverId ?? undefined);
    }
  };

  const renderPkReceiverSelection = () => {
    if (!pkBattleStreamers) return null;
    const { streamer1, streamer2 } = pkBattleStreamers;
    return (
      <div className="px-4 pt-3 flex items-center justify-around">
          <button onClick={() => setSelectedReceiverId(streamer1.userId)} className="flex flex-col items-center gap-2 text-center">
              <img 
                  src={streamer1.avatarUrl} 
                  alt={streamer1.name} 
                  className={`w-14 h-14 rounded-full object-cover border-4 transition-colors ${selectedReceiverId === streamer1.userId ? 'border-cyan-400' : 'border-transparent'}`}
              />
              <span className="text-xs text-gray-300 w-20 truncate">{streamer1.name}</span>
          </button>
           <span className="font-bold text-pink-400 text-xl">VS</span>
          <button onClick={() => setSelectedReceiverId(streamer2.userId)} className="flex flex-col items-center gap-2 text-center">
              <img 
                  src={streamer2.avatarUrl} 
                  alt={streamer2.name} 
                  className={`w-14 h-14 rounded-full object-cover border-4 transition-colors ${selectedReceiverId === streamer2.userId ? 'border-pink-400' : 'border-transparent'}`}
              />
              <span className="text-xs text-gray-300 w-20 truncate">{streamer2.name}</span>
          </button>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-transparent z-50 flex items-end"
      onClick={onClose}
    >
      <div 
        className="bg-[#212124]/90 backdrop-blur-md w-full rounded-t-2xl flex flex-col text-white animate-slide-up-fast"
        onClick={e => e.stopPropagation()}
      >
        {pkBattleStreamers && renderPkReceiverSelection()}
        <div className="p-4 grid grid-cols-4 gap-4 overflow-y-auto max-h-[40vh] min-h-[20vh] border-t border-b border-white/10">
            {isLoading ? (
                 <div className="col-span-4 text-center py-8 text-gray-400">Carregando presentes...</div>
            ) : gifts.length > 0 ? (
                gifts.map(gift => (
                    <button 
                        key={gift.id} 
                        onClick={() => setSelectedGiftId(gift.id)}
                        className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-all ${selectedGiftId === gift.id ? 'bg-white/20 scale-105' : 'bg-black/20'}`}
                    >
                        <Player
                            src={gift.animationUrl}
                            className="w-12 h-12"
                            autoplay
                            loop
                        />
                        <span className="text-xs">{gift.name}</span>
                        <div className="flex items-center gap-1 text-xs text-yellow-400">
                            <DiamondIcon className="w-3 h-3"/>
                            <span>{gift.price}</span>
                        </div>
                    </button>
                ))
            ) : (
                <div className="col-span-4 flex flex-col items-center justify-center text-center py-8 text-gray-400">
                    <GiftIcon className="w-16 h-16 mb-4 opacity-30" />
                    <p className="font-semibold">Nenhum presente disponível</p>
                    <p className="text-sm mt-1">Verifique novamente mais tarde.</p>
                </div>
            )}
        </div>

        <footer className="p-3 flex items-center justify-between">
            <button onClick={onRechargeClick} className="flex items-center gap-2">
                <DiamondIcon className="w-5 h-5"/>
                <span className="font-bold text-lg">{(user.wallet_diamonds || 0).toLocaleString()}</span>
                 <span className="text-gray-400 font-semibold text-lg ml-1">&gt;</span>
            </button>
            <button 
                onClick={handleSend}
                disabled={!selectedGift || (!!pkBattleStreamers && !selectedReceiverId)}
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
