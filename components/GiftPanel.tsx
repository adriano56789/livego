import React, { useState, useEffect } from 'react';
import type { User, Gift, PkBattleStreamer } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import DiamondIcon from './icons/DiamondIcon';
import GiftIcon from './icons/GiftIcon';
import LollipopIcon from './icons/LollipopIcon';
import DonutIcon from './icons/DonutIcon';
import RubberDuckIcon from './icons/RubberDuckIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import GameControllerIcon from './icons/GameControllerIcon';
import TreasureChestIcon from './icons/TreasureChestIcon';
import DiamondHeartIcon from './icons/DiamondHeartIcon';
import CrownV2Icon from './icons/CrownV2Icon';
import SportsCarIcon from './icons/SportsCarIcon';
import PrivateJetIcon from './icons/PrivateJetIcon';
import HeartGiftIcon from './icons/HeartGiftIcon';
import RoseGiftIcon from './icons/RoseGiftIcon';
import IceCreamGiftIcon from './icons/IceCreamGiftIcon';
import RocketGiftIcon from './icons/RocketGiftIcon';
import CastleGiftIcon from './icons/CastleGiftIcon';
import RingGiftIcon from './icons/RingGiftIcon';
import CutePandaIcon from './icons/CutePandaIcon';
import FunnyBombIcon from './icons/FunnyBombIcon';
import LovePotionIcon from './icons/LovePotionIcon';
import RockGuitarIcon from './icons/RockGuitarIcon';
import JackInTheBoxIcon from './icons/JackInTheBoxIcon';
import MagicUnicornIcon from './icons/MagicUnicornIcon';
import MoneyRainIcon from './icons/MoneyRainIcon';
import SpaceshipIcon from './icons/SpaceshipIcon';
import LionKingIcon from './icons/LionKingIcon';
import LegendaryDragonIcon from './icons/LegendaryDragonIcon';

interface GiftPanelProps {
  user: User;
  liveId: number;
  streamerId: number;
  isHost: boolean;
  onClose: () => void;
  onSendGift: (giftId: number, quantity: number, receiverId?: number) => void;
  onRechargeClick: () => void;
  pkBattleStreamers?: {
    streamer1: PkBattleStreamer;
    streamer2: PkBattleStreamer;
  };
  isPkMode?: boolean;
}

const iconMap: Record<string, React.FC<any>> = {
  HeartGift: HeartGiftIcon,
  RoseGift: RoseGiftIcon,
  IceCreamGift: IceCreamGiftIcon,
  RocketGift: RocketGiftIcon,
  CastleGift: CastleGiftIcon,
  RingGift: RingGiftIcon,
  Lollipop: LollipopIcon,
  Donut: DonutIcon,
  RubberDuck: RubberDuckIcon,
  Microphone: MicrophoneIcon,
  GameController: GameControllerIcon,
  TreasureChest: TreasureChestIcon,
  DiamondHeart: DiamondHeartIcon,
  CrownV2: CrownV2Icon,
  SportsCar: SportsCarIcon,
  PrivateJet: PrivateJetIcon,
  CutePanda: CutePandaIcon,
  FunnyBomb: FunnyBombIcon,
  LovePotion: LovePotionIcon,
  RockGuitar: RockGuitarIcon,
  JackInTheBox: JackInTheBoxIcon,
  MagicUnicorn: MagicUnicornIcon,
  MoneyRain: MoneyRainIcon,
  Spaceship: SpaceshipIcon,
  LionKing: LionKingIcon,
  LegendaryDragon: LegendaryDragonIcon,
};

const GiftPanel: React.FC<GiftPanelProps> = ({ user, liveId, streamerId, isHost, onClose, onSendGift, onRechargeClick, pkBattleStreamers, isPkMode }) => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGiftId, setSelectedGiftId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedReceiverId, setSelectedReceiverId] = useState<number | null>(pkBattleStreamers ? null : streamerId);
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
      onSendGift(selectedGift.id, quantity, selectedReceiverId ?? undefined);
    }
  };
  
  const quantityOptions = [1, 10, 30, 66, 99];

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

  const isSendDisabled = !selectedGift || 
    (!!pkBattleStreamers && !selectedReceiverId) || // Must select a receiver in PK
    (!pkBattleStreamers && isHost) || // Cannot send to self in solo stream
    (!!pkBattleStreamers && isHost && selectedReceiverId === user.id); // Cannot send to self in PK

  return (
    <div 
      className="fixed inset-0 bg-transparent z-50 flex items-end"
      onClick={onClose}
    >
      <div 
        className={`bg-[#212124]/90 backdrop-blur-md w-full rounded-t-2xl flex flex-col text-white animate-slide-up-fast ${isPkMode ? 'h-[35vh]' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {pkBattleStreamers && renderPkReceiverSelection()}
        <div className="p-4 grid grid-cols-4 gap-4 overflow-y-auto max-h-[40vh] min-h-[20vh] border-t border-white/10">
            {isLoading ? (
                 <div className="col-span-4 text-center py-8 text-gray-400">Carregando presentes...</div>
            ) : gifts.length > 0 ? (
                gifts.map(gift => {
                    const IconComponent = gift.iconComponent ? iconMap[gift.iconComponent] : null;
                    return (
                        <button 
                            key={gift.id} 
                            onClick={() => setSelectedGiftId(gift.id)}
                            className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-all ${selectedGiftId === gift.id ? 'bg-white/20 scale-105' : 'bg-black/20'}`}
                        >
                            <div className="w-12 h-12 flex items-center justify-center">
                                {IconComponent ? (
                                    <IconComponent className="w-full h-full object-contain" />
                                ) : (
                                    <img
                                        src={gift.imageUrl}
                                        alt={gift.name}
                                        className="w-12 h-12 object-contain"
                                    />
                                )}
                            </div>
                            <span className="text-xs">{gift.name}</span>
                            <div className="flex items-center gap-1 text-xs text-yellow-400">
                                <DiamondIcon className="w-3 h-3"/>
                                <span>{gift.price}</span>
                            </div>
                        </button>
                    )
                })
            ) : (
                <div className="col-span-4 flex flex-col items-center justify-center text-center py-8 text-gray-400">
                    <GiftIcon className="w-16 h-16 mb-4 opacity-30" />
                    <p className="font-semibold">Nenhum presente disponível</p>
                    <p className="text-sm mt-1">Verifique novamente mais tarde.</p>
                </div>
            )}
        </div>
        
        <div className="border-t border-b border-white/10 px-4 py-2">
            <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-300">Quantidade</span>
                <div className="flex items-center gap-2">
                    {quantityOptions.map(q => (
                        <button
                            key={q}
                            onClick={() => setQuantity(q)}
                            className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${
                                quantity === q ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300'
                            }`}
                        >
                            {q}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <footer className="p-3 flex items-center justify-between">
            <button onClick={onRechargeClick} className="flex items-center gap-2">
                <DiamondIcon className="w-5 h-5"/>
                <span className="font-bold text-lg">{(user.wallet_diamonds || 0).toLocaleString()}</span>
                 <span className="text-gray-400 font-semibold text-lg ml-1">&gt;</span>
            </button>
            <button 
                onClick={handleSend}
                disabled={isSendDisabled}
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