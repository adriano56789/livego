
import React, { useState, useEffect, useRef } from 'react';
import { MusicTrack } from '../types';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';
import { PlayIcon, CloseIcon } from './icons';

interface MusicSelectionModalProps {
  onClose: () => void;
  onSelect: (music: MusicTrack) => void;
}

const MusicSelectionModal: React.FC<MusicSelectionModalProps> = ({ onClose, onSelect }) => {
  const [music, setMusic] = useState<MusicTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    api.getMusicLibrary()
      .then(data => setMusic(data || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (audioEl) {
      const handleEnded = () => setPlayingId(null);
      audioEl.addEventListener('ended', handleEnded);
      return () => {
        audioEl.removeEventListener('ended', handleEnded);
        audioEl.pause();
      };
    }
  }, [playingId]);
  
  // Cleanup on component unmount
  useEffect(() => {
      return () => {
          if (audioRef.current) {
              audioRef.current.pause();
          }
      }
  }, []);

  const togglePlay = (track: MusicTrack) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (playingId === track.id) {
      setPlayingId(null);
    } else {
      const newAudio = new Audio(track.url);
      audioRef.current = newAudio;
      newAudio.play();
      setPlayingId(track.id);
    }
  };

  const handleUseMusic = () => {
    if (selectedMusic) {
      onSelect(selectedMusic);
    }
  };

  return (
    <div
      className="absolute inset-0 z-[60] flex items-end justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-[#1C1C1E] w-full max-w-md h-[70%] rounded-t-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex-shrink-0 p-4 text-center relative border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Adicionar música</h2>
          <button onClick={onClose} className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-white">
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>
        <main className="flex-grow p-2 overflow-y-auto no-scrollbar">
          {isLoading ? (
            <div className="flex h-full items-center justify-center"><LoadingSpinner /></div>
          ) : (
            music.map(track => (
              <div
                key={track.id}
                className={`flex items-center space-x-4 p-2 rounded-lg cursor-pointer ${selectedMusic?.id === track.id ? 'bg-purple-500/20' : 'hover:bg-gray-800/50'}`}
                onClick={() => setSelectedMusic(track)}
              >
                <button
                  onClick={e => { e.stopPropagation(); togglePlay(track); }}
                  className="w-12 h-12 rounded bg-black/20 flex items-center justify-center flex-shrink-0"
                >
                  {playingId === track.id ? (
                    <div className="w-4 h-4 bg-white" />
                  ) : (
                    <PlayIcon className="w-6 h-6 text-white" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{track.title}</p>
                  <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                </div>
                {selectedMusic?.id === track.id && (
                    <button onClick={handleUseMusic} className="bg-purple-600 text-white font-bold px-5 py-2 rounded-full text-sm">Usar</button>
                )}
              </div>
            ))
          )}
        </main>
      </div>
    </div>
  );
};

export default MusicSelectionModal;
