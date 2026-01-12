import React from 'react';
import { SearchIcon, GlobeIcon, BellIcon } from './icons';
import { Streamer } from '../types';
import { useTranslation } from '../i18n';
import { LoadingSpinner } from './Loading';

interface MainScreenProps {
  onOpenReminderModal: () => void;
  onOpenRegionModal: () => void;
  onSelectStream: (streamer: Streamer) => void;
  onOpenSearch: () => void;
  streamers: Streamer[];
  isLoading: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  showLocationBanner: boolean;
}

const MainScreen: React.FC<MainScreenProps> = ({ 
  onOpenReminderModal, 
  onOpenRegionModal, 
  onSelectStream, 
  onOpenSearch, 
  streamers, 
  isLoading,
  activeTab,
  onTabChange
}) => {
  const { t } = useTranslation();

  const allCategories = [
    { id: 'popular', label: 'Popular' },
    { id: 'followed', label: 'Seguido' },
    { id: 'nearby', label: 'Perto' },
    { id: 'pk', label: 'PK' },
    { id: 'new', label: 'Novo' },
    { id: 'music', label: 'Música' },
    { id: 'dance', label: 'Dança' },
    { id: 'game', label: 'Jogos' },
    { id: 'voice', label: 'Voz' },
    { id: 'party', label: 'Festa' }
  ];

  const handleTabClick = (tabId: string) => {
    if (isLoading) return;
    onTabChange(tabId);
  };

  const safeStreamersList = Array.isArray(streamers) ? streamers : [];

  return (
    <div className="flex flex-col h-full w-full bg-[#121212] text-white pb-20 select-text">
      <div className="bg-[#121212]/95 backdrop-blur-md sticky top-0 z-20 pt-2 pb-0 border-b border-white/5 shadow-sm shadow-black/40">
        <div className="flex items-center justify-between px-4 py-2">
           <h1 className="text-[24px] font-black text-white tracking-wide font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 drop-shadow-sm select-none">
             LiveGo
           </h1>
           
           <div className="flex items-center gap-3">
              <button 
                onClick={onOpenReminderModal}
                className="w-9 h-9 rounded-xl hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center"
              >
                <BellIcon className="w-6 h-6 text-gray-200" strokeWidth={2} />
              </button>
              
              <button 
                onClick={onOpenRegionModal} 
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors active:scale-95"
              >
                 <GlobeIcon size={22} className="text-gray-200" strokeWidth={1.5} />
              </button>

              <button 
                onClick={onOpenSearch} 
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors active:scale-95"
              >
                <SearchIcon size={22} className="text-gray-200" strokeWidth={2.5} />
              </button>
           </div>
        </div>

        <div className="w-full relative">
           <div className="flex items-center gap-4 overflow-x-auto px-4 pb-0 pt-1 whitespace-nowrap touch-pan-x outline-none no-scrollbar">
              {allCategories.map((cat) => (
                <button 
                  key={cat.id}
                  onClick={() => handleTabClick(cat.id)}
                  className={`py-3 px-2 text-sm transition-colors duration-300 relative shrink-0 select-none ${activeTab === cat.id ? 'text-white font-bold' : 'text-gray-400 font-medium hover:text-gray-200'}`}
                >
                  <span className="z-10 relative">{cat.label}</span>
                  {activeTab === cat.id && (
                    <div className="absolute bottom-1.5 w-full h-[3px] bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.6)]"></div>
                  )}
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-1 outline-none scroll-smooth touch-pan-y overscroll-contain no-scrollbar">
         {isLoading ? (
             <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-4">
                 <LoadingSpinner />
                 <p className="text-xs font-bold uppercase tracking-widest animate-pulse select-none">Buscando transmissões...</p>
             </div>
         ) : safeStreamersList.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-gray-500 p-8 text-center select-none">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <GlobeIcon className="opacity-20" size={32} />
                </div>
                <p className="font-bold text-sm">Nenhuma live ativa nesta categoria.</p>
                <p className="text-[10px] mt-1 text-gray-600">Tente novamente mais tarde ou mude de aba.</p>
             </div>
         ) : (
             <div className="grid grid-cols-2 gap-1 px-1 pt-1 pb-20">
                {safeStreamersList.map((streamer) => (
                    <div 
                      key={streamer.id} 
                      onClick={() => onSelectStream(streamer)}
                      className="relative aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden cursor-pointer group animate-in fade-in duration-500 select-text"
                    >
                        <img 
                          src={streamer.thumbnail || `https://picsum.photos/seed/${streamer.id}/400/600`} 
                          alt={streamer.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 pointer-events-none"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />
                        <div className="absolute bottom-2 left-2 right-2 pointer-events-auto">
                            <div className="font-bold text-white text-[13px] truncate leading-tight mb-1 drop-shadow-md select-text">
                                {streamer.name}
                            </div>
                            <div className="text-[10px] text-gray-200 flex items-center gap-1 drop-shadow-md font-medium select-none">
                                <span className="flex items-center gap-0.5"><div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> {(streamer.viewers || 0).toLocaleString()}</span>
                                {streamer.location && <span className="opacity-60 ml-auto">📍 {streamer.location}</span>}
                            </div>
                        </div>
                    </div>
                ))}
             </div>
         )}
      </div>
    </div>
  );
};

export default MainScreen;