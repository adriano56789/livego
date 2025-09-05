

import React, { useState, useEffect, useCallback } from 'react';
import type { User, Stream, PkBattle, Category, AppView } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import StreamerCard from './StreamerCard';
import PkBattleCard from './PkBattleCard';
import SearchIcon from './icons/SearchIcon';
import TrophyIcon from './icons/TrophyIcon';
import JoinPrivateStreamModal from './JoinPrivateStreamModal';
import LocationPermissionBanner from './LocationPermissionBanner';
import LocationPermissionModal from './LocationPermissionModal';

interface LiveFeedScreenProps {
  user: User;
  onViewStream: (stream: Stream | PkBattle) => void;
  onGoLiveClick: () => void;
  activeCategory: Category;
  onSelectCategory: (category: Category) => void;
  onUpdateUser: (user: User) => void;
  onNavigateToChat: (userId: number) => void;
  onViewProtectors: (userId: number) => void;
  onNavigate: (view: AppView) => void;
  locationPermission: 'prompt' | 'granted' | 'denied';
  setLocationPermission: (permission: 'prompt' | 'granted' | 'denied') => void;
}

export const LiveFeedScreen: React.FC<LiveFeedScreenProps> = ({
  user,
  onViewStream,
  activeCategory,
  onSelectCategory,
  onNavigate,
  locationPermission,
  setLocationPermission,
  onUpdateUser,
}) => {
  const [streams, setStreams] = useState<(Stream | PkBattle)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [streamToJoin, setStreamToJoin] = useState<Stream | null>(null);

  const categories: Category[] = ['Popular', 'Seguindo', 'Perto', 'Privada', 'PK', 'Novo', 'Música', 'Dança', 'Festa'];

  const fetchStreams = useCallback(async () => {
    setIsLoading(true);
    try {
      let fetchedStreams: (Stream | PkBattle)[] = [];
      const region = user.country || 'global';
      switch (activeCategory) {
        case 'Popular':
          fetchedStreams = await liveStreamService.getPopularStreams(region);
          break;
        case 'Seguindo':
          fetchedStreams = await liveStreamService.getFollowingStreams(user.id, region);
          break;
        case 'PK':
          fetchedStreams = await liveStreamService.getPkBattles(region);
          break;
        case 'Novo':
          fetchedStreams = await liveStreamService.getNewStreams(region);
          break;
        case 'Privada':
          fetchedStreams = await liveStreamService.getPrivateStreams(user.id, region);
          break;
        case 'Perto':
          if (locationPermission === 'granted') {
            fetchedStreams = await liveStreamService.getNearbyStreams(user.id, 'approximate');
          } else {
            fetchedStreams = [];
          }
          break;
        case 'Música':
        case 'Dança':
        case 'Festa':
          fetchedStreams = await liveStreamService.getStreamsForCategory(activeCategory, region);
          break;
        default:
          fetchedStreams = await liveStreamService.getPopularStreams(region);
      }
      setStreams(fetchedStreams);
    } catch (error) {
      console.error(`Failed to fetch streams for category ${activeCategory}:`, error);
      setStreams([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, user.id, user.country, locationPermission]);

  useEffect(() => {
    if (activeCategory === 'Perto' && locationPermission !== 'granted') {
      setIsLoading(false);
      setStreams([]);
      return;
    }
    fetchStreams();
  }, [fetchStreams, activeCategory, locationPermission]);
  
  const handleLocationAllow = (accuracy: 'exact' | 'approximate') => {
    liveStreamService.requestLocationPermission(accuracy).then(({ latitude, longitude }) => {
        console.log("Location granted:", { latitude, longitude });
    });
    setLocationPermission('granted');
    setIsLocationModalOpen(false);
  };
  
  const handleLocationDeny = () => {
    setLocationPermission('denied');
    setIsLocationModalOpen(false);
  };
  
  const handleStreamCardClick = (stream: Stream) => {
    // Check if the stream is private and the user hasn't paid yet and is not the host
    if (stream.isPrivate && !user.paid_stream_ids?.includes(stream.id) && user.id !== stream.userId) {
        setStreamToJoin(stream);
    } else {
        onViewStream(stream);
    }
  };

  const renderHeader = () => (
    <header className="px-4 pt-6 pb-2 sticky top-0 bg-black/80 backdrop-blur-sm z-10">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold tracking-tighter text-white">LiveGo</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('ranking')} aria-label="Ranking"><TrophyIcon className="w-7 h-7 text-yellow-400" /></button>
          <button onClick={() => onNavigate('search')} aria-label="Search"><SearchIcon className="w-6 h-6 text-white" /></button>
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex items-center gap-4 border-b border-gray-800">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`py-3 font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </header>
  );

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex-grow flex items-center justify-center"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>;
    }
    
    if (activeCategory === 'Perto' && locationPermission !== 'granted') {
        return (
            <div className="flex-grow flex flex-col items-center justify-center text-center px-4">
                <p className="text-gray-400 mb-4">Ative a permissão de localização para ver streamers perto de você.</p>
                <button onClick={() => setIsLocationModalOpen(true)} className="bg-purple-600 text-white font-bold py-3 px-8 rounded-full">
                    Ativar Localização
                </button>
            </div>
        )
    }

    if (streams.length === 0) {
      return <div className="flex-grow flex items-center justify-center text-gray-500">Nenhuma transmissão ao vivo encontrada.</div>;
    }

    return (
      <div className="grid grid-cols-2 gap-2 p-2">
        {streams.map(stream => {
          if ('streamer1' in stream) {
            return <PkBattleCard key={stream.id} battle={stream} onViewStream={onViewStream} />;
          } else {
            return <StreamerCard key={stream.id} stream={stream} onViewStream={handleStreamCardClick} currentUser={user} />;
          }
        })}
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-black flex flex-col font-sans">
      {renderHeader()}
      {activeCategory === 'Perto' && locationPermission === 'prompt' && (
        <div className="px-2 pt-2">
            <LocationPermissionBanner onClick={() => setIsLocationModalOpen(true)} />
        </div>
      )}
      <main className="flex-grow overflow-y-auto scrollbar-hide">
        {renderContent()}
      </main>
       {streamToJoin && (
        <JoinPrivateStreamModal
          user={user}
          stream={streamToJoin}
          onClose={() => setStreamToJoin(null)}
          onViewStream={onViewStream}
          onUpdateUser={onUpdateUser}
          onNavigate={() => onNavigate('diamond-purchase')}
        />
      )}
      <LocationPermissionModal
        isOpen={isLocationModalOpen}
        onAllow={handleLocationAllow}
        onDeny={handleLocationDeny}
      />
    </div>
  );
};

export default LiveFeedScreen;
