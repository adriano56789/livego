import React from 'react';
import CrossIcon from './icons/CrossIcon';
import SettingsIcon from './icons/SettingsIcon';
import CoinBIcon from './icons/CoinBIcon';
import HeaderTrophyIcon from './icons/HeaderTrophyIcon';

interface PkLiveRoomModalProps {
  onClose: () => void;
  onRandomMatch: () => void;
  onPairWithFriends: () => void;
  friendsAvailable: number;
  onOpenSettings: () => void;
}

const PkLiveRoomModal: React.FC<PkLiveRoomModalProps> = ({ onClose, onRandomMatch, onPairWithFriends, friendsAvailable, onOpenSettings }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={onClose}>
      <div
        className="bg-gray-900 w-full rounded-t-2xl flex flex-col text-white animate-slide-up-fast"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 flex items-center justify-between border-b border-gray-700/50">
          <button onClick={onOpenSettings}><SettingsIcon className="w-6 h-6 text-gray-400" /></button>
          <h2 className="font-bold text-lg">Sala ao vivo PK</h2>
          <button onClick={onClose}><CrossIcon className="w-6 h-6 text-gray-400" /></button>
        </header>

        <main className="p-4 space-y-4">
          <button 
            onClick={onRandomMatch}
            className="relative w-full p-4 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-600 overflow-hidden text-left shadow-lg"
          >
            <div className="absolute -top-4 -left-4 text-6xl opacity-20 transform rotate-[-30deg]">😘</div>
            <div className="absolute -bottom-2 right-10 text-4xl opacity-20 transform rotate-[15deg]">⭐</div>
            <div className="absolute top-2 right-2 text-2xl opacity-20 transform rotate-[25deg]">💖</div>
            <div className="relative z-10 flex items-center justify-between">
              <span className="font-bold text-xl drop-shadow-sm">Correspondência aleatória</span>
              <span className="font-bold text-2xl drop-shadow-sm">&gt;</span>
            </div>
          </button>

          <button 
            onClick={onPairWithFriends}
            className="relative w-full p-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 overflow-hidden text-left shadow-lg"
          >
             <div className="absolute -top-2 -left-2 w-24 h-24">
                <img src="https://storage.googleapis.com/genai-assets/user-waving.png" alt="" className="w-full h-full object-contain" />
             </div>
            <div className="relative z-10 flex items-center justify-between ml-20">
              <div>
                <span className="font-bold text-xl">Parear com amigos</span>
                <p className="text-sm text-gray-300">{friendsAvailable} amigos pendentes para parear</p>
              </div>
              <div className="flex items-center gap-1">
                 <div className="flex -space-x-4">
                    <img className="w-8 h-8 rounded-full border-2 border-purple-400" src="https://i.pravatar.cc/150?u=401" alt=""/>
                    <img className="w-8 h-8 rounded-full border-2 border-purple-400" src="https://i.pravatar.cc/150?u=402" alt=""/>
                    <img className="w-8 h-8 rounded-full border-2 border-purple-400" src="https://i.pravatar.cc/150?u=403" alt=""/>
                 </div>
                <span className="font-bold text-2xl">&gt;</span>
              </div>
            </div>
          </button>
        </main>

        <footer className="p-4 flex items-center justify-center gap-6 text-sm text-gray-400 border-t border-gray-700/50">
            <div className="flex items-center gap-1">
                <HeaderTrophyIcon className="w-4 h-4 text-yellow-500" />
                <span>x0</span>
            </div>
            <div className="flex items-center gap-1">
                <CoinBIcon className="w-4 h-4" />
                <span>0</span>
            </div>
            <span>&gt;</span>
        </footer>
      </div>
      <style>{`
        @keyframes slide-up-fast { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up-fast { animation: slide-up-fast 0.25s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default PkLiveRoomModal;