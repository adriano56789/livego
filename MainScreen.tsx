
import React, { useState } from 'react';
import Header from './Header';
import { Streamer } from '../types';
import { useTranslation } from '../i18n';
import { LoadingSpinner } from './components/Loading';

interface MainScreenProps {
  onOpenReminderModal: () => void;
  onOpenRegionModal: () => void;
  onSelectStream: (streamer: Streamer) => void;
  onOpenSearch: () => void;
  streamers: Streamer[];
  isLoading: boolean;
}

const StreamerCard: React.FC<{streamer: Streamer; onSelect: (streamer: Streamer) => void}> = ({ streamer, onSelect }) => (
    <div className="relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer group" onClick={() => onSelect(streamer)}>
        <img src={streamer.avatar} alt={streamer.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        {streamer.country && streamer.country !== 'ICON_GLOBE' && (
            <div className="absolute top-2 right-2 w-6 h-auto aspect-[4/3] rounded-sm overflow-hidden ring-1 ring-black/20">
                <img src={`https://flagcdn.com/${streamer.country}.svg`} alt={`${streamer.country} flag`} className="w-full h-full object-cover" />
            </div>
        )}
        <div className="absolute inset-0 flex flex-col justify-end p-2 text-white">
            <p className="font-bold text-sm">{streamer.name} {streamer.icon}</p>
            <p className="text-xs text-gray-300 truncate">{streamer.message || streamer.location}</p>
        </div>
    </div>
);


const MainScreen: React.FC<MainScreenProps> = ({ onOpenReminderModal, onOpenRegionModal, onSelectStream, onOpenSearch, streamers, isLoading }) => {
  const { t } = useTranslation();
  const tabs = [
    { key: 'popular', label: t('main.popular') },
    { key: 'followed', label: t('main.followed') },
    { key: 'nearby', label: t('main.nearby') },
    { key: 'pk', label: t('main.pk') },
    { key: 'new', label: t('main.new') },
    { key: 'music', label: t('main.music') },
    { key: 'dance', label: t('main.dance') },
    { key: 'party', label: t('main.party') },
    { key: 'private', label: t('main.private') },
  ];
  const [activeTab, setActiveTab] = useState(tabs[0].key);

  return (
    <div className="flex flex-col bg-[#111111] h-full">
      <Header onOpenReminderModal={onOpenReminderModal} onOpenRegionModal={onOpenRegionModal} onOpenSearch={onOpenSearch} />
      
      <nav className="flex-shrink-0">
        <div className="flex justify-between items-center border-b border-gray-700 px-4">
          <div className="flex space-x-6 overflow-x-auto whitespace-nowrap no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-3 text-sm font-medium transition-colors flex-shrink-0 ${
                  activeTab === tab.key
                    ? 'text-white font-bold border-b-2 border-white -mb-px'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="flex-grow p-2 pb-24 overflow-y-auto no-scrollbar">
        {isLoading ? (
            <div className="h-full flex items-center justify-center">
                <LoadingSpinner />
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-2">
                {streamers.map(streamer => (
                    <StreamerCard key={streamer.id} streamer={streamer} onSelect={onSelectStream} />
                ))}
            </div>
        )}
      </main>
    </div>
  );
};

export default MainScreen;
