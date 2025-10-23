import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FeedPhoto, User } from '../types';
import { LoadingSpinner } from './Loading';
import { useTranslation } from '../i18n';

interface VideoScreenProps {
  onViewProfile: (user: User) => void;
  onOpenPhotoViewer: (photos: FeedPhoto[], index: number) => void;
}

const VideoScreen: React.FC<VideoScreenProps> = ({ onViewProfile, onOpenPhotoViewer }) => {
  const [feed, setFeed] = useState<FeedPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    setIsLoading(true);
    api.getPhotoFeed()
      .then(data => {
        setFeed(data || []);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="bg-[#111] h-full text-white overflow-y-auto no-scrollbar pb-24">
      <header className="p-4 text-center sticky top-0 bg-[#111]/80 backdrop-blur-sm z-10">
        <h1 className="text-xl font-bold">Explorar</h1>
      </header>
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner />
        </div>
      ) : feed.length > 0 ? (
        <div className="grid grid-cols-3 gap-0.5">
          {feed.map((item, index) => (
            <div key={item.id} className="relative aspect-square group cursor-pointer" onClick={() => onOpenPhotoViewer(feed, index)}>
              <img src={item.photoUrl} alt={`Post by ${item.user.name}`} className="w-full h-full object-cover bg-gray-800" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
                <button onClick={(e) => { e.stopPropagation(); onViewProfile(item.user); }} className="flex items-center space-x-1">
                  <img src={item.user.avatarUrl} alt={item.user.name} className="w-4 h-4 rounded-full object-cover" />
                  <span className="text-white text-xs font-semibold truncate">{item.user.name}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
            <p>Nenhuma foto para explorar ainda.</p>
        </div>
      )}
    </div>
  );
};

export default VideoScreen;