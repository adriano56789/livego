

import React, { useState, useEffect } from 'react';
import { MusicTrack, FeedPhoto, User } from '../types';
import { api } from '../services/api';
import { BackIcon, PlayIcon, MusicNoteIcon } from './icons';
import { LoadingSpinner } from './Loading';

interface MusicDetailScreenProps {
  music: MusicTrack;
  onClose: () => void;
  onUseSound: (music: MusicTrack) => void;
}

const MusicDetailScreen: React.FC<MusicDetailScreenProps> = ({ music, onClose, onUseSound }) => {
  const [videos, setVideos] = useState<FeedPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (music.id) {
        setIsLoading(true);
        api.getVideosByMusicId(music.id)
          .then(setVideos)
          .catch(console.error)
          .finally(() => setIsLoading(false));
    } else {
        setIsLoading(false);
        setVideos([]);
    }
  }, [music.id]);

  return (
    <div className="absolute inset-0 bg-black z-50 flex flex-col">
      <header className="flex items-center p-4 flex-shrink-0 z-10 bg-black/50 backdrop-blur-sm">
        <button onClick={onClose} className="p-2 -ml-2"><BackIcon className="w-6 h-6" /></button>
        <div className="flex-grow text-center">
          <h1 className="text-lg font-semibold truncate">{music.title}</h1>
          <p className="text-sm text-gray-400">{music.artist}</p>
        </div>
        <div className="w-6 h-6 p-2"></div>
      </header>

      <main className="flex-grow overflow-y-auto no-scrollbar">
        <div className="p-4 flex flex-col items-center">
          <div className="w-32 h-32 bg-gray-800 rounded-lg flex items-center justify-center mb-4 shadow-lg">
            <MusicNoteIcon className="w-16 h-16 text-gray-500" />
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center mt-8"><LoadingSpinner /></div>
        ) : videos.length > 0 ? (
          <div className="grid grid-cols-3 gap-0.5">
            {videos.map(video => (
              <div key={video.id} className="relative aspect-[3/4] bg-gray-900">
                <img src={video.thumbnailUrl || video.photoUrl} alt="" className="w-full h-full object-cover" />
                {video.type === 'video' && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                     <PlayIcon className="w-8 h-8 text-white/70" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
            <div className="text-center text-gray-500 py-16">
                <p>Nenhum vídeo usando este som ainda.</p>
                <p className="text-sm">Seja o primeiro a criar!</p>
            </div>
        )}
      </main>

      <footer className="p-4 border-t border-gray-800 flex-shrink-0 bg-black/50 backdrop-blur-sm">
        <button
          onClick={() => onUseSound(music)}
          className="w-full bg-pink-600 text-white font-bold py-3 rounded-full text-lg hover:bg-pink-700 transition-colors flex items-center justify-center space-x-2"
        >
          <CameraIcon className="w-6 h-6" />
          <span>Usar este som</span>
        </button>
      </footer>
    </div>
  );
};

// Simple Camera Icon for the button
const CameraIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9a2.25 2.25 0 00-2.25 2.25v9A2.25 2.25 0 004.5 18.75z" />
    </svg>
);


export default MusicDetailScreen;