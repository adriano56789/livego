import React, { useState } from 'react';
import { Streamer } from '../types';
import { BackIcon, ClockIcon, PlayIcon, PlusIcon } from './icons';
import { useTranslation } from '../i18n';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStream: (streamer: Streamer) => void;
  streamers: Streamer[];
  onOpenLiveHistory: () => void;
}

interface StreamerItemProps {
    streamer: Streamer;
    isFollowed: boolean;
    onFollow: (streamerId: string) => void;
    onSelectStream: (streamer: Streamer) => void;
}

const StreamerItem: React.FC<StreamerItemProps> = ({ streamer, isFollowed, onFollow, onSelectStream }) => (
  <div className="flex items-center space-x-3 p-3 hover:bg-gray-700/50 rounded-lg cursor-pointer" onClick={() => onSelectStream(streamer)}>
    <div className="relative flex-shrink-0">
      <img src={streamer.avatar} alt={streamer.name} className="w-10 h-10 rounded-lg object-cover bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" />
      {streamer.isHot && <span className="absolute -top-1 -left-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">QUENTE</span>}
    </div>
    <div className="flex-grow">
      <div className="flex items-center">
        <p className="font-bold text-white text-sm">{streamer.name} {streamer.icon}</p>
      </div>
      <p className="text-xs text-gray-400">{streamer.location}</p>
      <p className="text-xs text-gray-500">{streamer.time}</p>
      <div className="flex items-center mt-1 text-xs text-gray-300">
        <PlayIcon className="w-3 h-3 mr-1 text-gray-400" />
        <span>{streamer.message}</span>
      </div>
      {streamer.tags.length > 0 && (
         <div className="mt-2">
            {streamer.tags.map(tag => (
                <span key={tag} className="bg-gray-700 text-gray-300 text-[10px] px-1.5 py-0.5 rounded-full">{tag}</span>
            ))}
         </div>
      )}
    </div>
     {!isFollowed && (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onFollow(streamer.id);
            }}
            className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl shadow-lg hover:bg-blue-600 transition-colors flex-shrink-0"
            aria-label={`Follow ${streamer.name}`}
        >
            <PlusIcon className="w-5 h-5"/>
        </button>
    )}
  </div>
);


const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, onSelectStream, streamers, onOpenLiveHistory }) => {
  const [followedStreamers, setFollowedStreamers] = useState<string[]>([]);
  const { t } = useTranslation();

  const handleFollow = (streamerId: string) => {
    setFollowedStreamers(prev => [...prev, streamerId]);
  };

  return (
    <div 
      className={`absolute inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose}
    >
      <div
        className={`absolute top-0 right-0 h-full w-5/6 max-w-sm bg-[#1C1C1E] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                <div className="flex items-center space-x-4">
                    <button onClick={onClose} className="text-gray-300 hover:text-white">
                        <BackIcon className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-bold">{t('reminder.title')}</h2>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onOpenLiveHistory(); }} className="text-gray-300 hover:text-white">
                    <ClockIcon className="w-5 h-5" />
                </button>
            </header>
            <div className="p-4 flex-shrink-0">
                <span className="text-gray-300 bg-gray-700/50 px-3 py-1 rounded-full text-sm">{t('reminder.nearby')}</span>
            </div>
            <div className="flex-grow overflow-y-auto relative no-scrollbar">
                {(Array.isArray(streamers) ? streamers : []).map(streamer => (
                    <StreamerItem 
                        key={streamer.id} 
                        streamer={streamer} 
                        isFollowed={followedStreamers.includes(streamer.id)}
                        onFollow={handleFollow}
                        onSelectStream={onSelectStream}
                    />
                ))}
                <button className="absolute bottom-6 right-6 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg hover:bg-blue-600 transition-colors">
                    +
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;
