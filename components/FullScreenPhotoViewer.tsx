

import React, { useState, useEffect, useRef } from 'react';

import { FeedPhoto, User } from '../types';

import { CloseIcon, HeartIcon, PlayIcon } from './icons';

import { api } from '../services/api';



interface FullScreenPhotoViewerProps {

  photos: FeedPhoto[];

  initialIndex: number;

  onClose: () => void;

  onViewProfile: (user: User) => void;

  onPhotoLiked: () => void;

}



const MediaItem: React.FC<{ 

    photo: FeedPhoto; 

    state: { likes: number; isLiked: boolean }; 

    onLike: (id: string) => void;

    onViewProfile: (user: User) => void;

    isLiking?: boolean;

}> = ({ photo, state, onLike, onViewProfile, isLiking = false }) => {

    // Robust video check

    const isVideo = photo.photoUrl.toLowerCase().includes('data:video') || 

                    photo.photoUrl.toLowerCase().endsWith('.mp4') || 

                    photo.photoUrl.toLowerCase().endsWith('.webm') ||

                    photo.photoUrl.toLowerCase().includes('video');

    

    const videoRef = useRef<HTMLVideoElement>(null);

    const [isPlaying, setIsPlaying] = useState(false); 



    useEffect(() => {

        if (isVideo && videoRef.current) {

            // Attempt to play automatically when component mounts/is visible

            const playPromise = videoRef.current.play();

            if (playPromise !== undefined) {

                playPromise.then(() => {

                    setIsPlaying(true);

                }).catch(error => {


                    setIsPlaying(false);

                });

            }

        }

    }, [isVideo]);



    const togglePlay = (e: React.MouseEvent) => {

        e.stopPropagation();

        if (videoRef.current) {

            if (videoRef.current.paused) {

                videoRef.current.play();

                setIsPlaying(true);

            } else {

                videoRef.current.pause();

                setIsPlaying(false);

            }

        }

    };



    return (
        <div className="w-full h-full flex-shrink-0 relative flex items-center justify-center bg-black">
            {isVideo ? (
                <div className="relative w-full h-full flex items-center justify-center" onClick={togglePlay}>
                     <video 
                        ref={videoRef}
                        src={photo.photoUrl} 
                        className="max-w-full max-h-full object-contain" 
                        playsInline 
                        loop 
                    />
                    {!isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                            <PlayIcon className="w-20 h-20 text-white/80 opacity-80" />
                        </div>
                    )}
                </div>
            ) : (
                <img src={photo.photoUrl} alt="Full screen view" className="max-w-full max-h-full object-contain" />
            )}

            {/* Bottom Overlay Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
                <div className="flex justify-between items-end pointer-events-auto">
                    <button onClick={() => onViewProfile(photo.user)} className="flex items-center space-x-3 mb-2">
                        <img src={photo.user.avatarUrl} alt={photo.user.name} className="w-10 h-10 rounded-full object-cover border border-white/50" />
                        <span className="font-bold text-white text-lg shadow-black drop-shadow-md">{photo.user.name}</span>
                    </button>

                    <div className="flex flex-col items-center space-y-1">
                        <button 
                            onClick={() => onLike(photo.id)} 
                            className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLiking}
                        >
                            {isLiking ? (
                                <div className="w-8 h-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            ) : (
                                <HeartIcon 
                                    className={`w-8 h-8 transition-colors ${state.isLiked ? 'text-red-500' : 'text-white'}`} 
                                    fill={state.isLiked ? 'currentColor' : 'none'} 
                                    stroke="currentColor" 
                                    strokeWidth={2} 
                                />
                            )}
                        </button>
                        <span className="text-white font-medium text-sm drop-shadow-md">{state.likes.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );

};



const FullScreenPhotoViewer: React.FC<FullScreenPhotoViewerProps> = ({ photos, initialIndex, onClose, onViewProfile, onPhotoLiked }) => {

  if (!photos || photos.length === 0) return null;

  const validIndex = Math.max(0, Math.min(initialIndex, photos.length - 1));

  const [photoStates, setPhotoStates] = useState(new Map(photos.map(p => [p.id, { likes: p.likes, isLiked: p.isLiked }])));

  const [likingPhotos, setLikingPhotos] = useState<Set<string>>(new Set()); // Track which photos are being liked

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0); // Salvar posição original do scroll
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map()); // Debounce timers

  // Salvar posição do scroll ao abrir
  useEffect(() => {
    scrollPositionRef.current = window.scrollY;
  }, []);

  // Restaurar posição do scroll ao fechar
  useEffect(() => {
    return () => {
      // Restaurar posição original quando componente for desmontado
      window.scrollTo(0, scrollPositionRef.current);
    };
  }, []);

  // Use layout effect para garantir scroll antes do paint e evitar duplicação
  useEffect(() => {
    if (containerRef.current && photos[validIndex]) {
      // Encontrar o container interno com flex
      const flexContainer = containerRef.current.querySelector('.flex.h-full') as HTMLElement;
      if (flexContainer) {
        // Usar scrollLeft para horizontal em vez de scrollIntoView
        const containerWidth = containerRef.current.clientWidth;
        const targetScrollLeft = validIndex * containerWidth;
        
        containerRef.current.scrollLeft = targetScrollLeft;
      }
    }
  }, [validIndex, photos.length]); // Adicionado photos.length para garantir atualização quando as fotos mudam

  const handleLike = async (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo || likingPhotos.has(photoId)) return; // Prevent multiple clicks

    // Clear existing timer for this photo
    const existingTimer = debounceTimersRef.current.get(photoId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set loading state
    setLikingPhotos(prev => new Set(prev).add(photoId));

    const currentState = photoStates.get(photoId) || { likes: photo.likes, isLiked: photo.isLiked };
    const newIsLiked = !currentState.isLiked;
    const newLikes = newIsLiked ? currentState.likes + 1 : currentState.likes - 1;
    
    // Optimistic update
    setPhotoStates(new Map(photoStates.set(photoId, { likes: newLikes, isLiked: newIsLiked })));

    // Debounce API call
    const timer = setTimeout(async () => {
      try {
        const response = await api.likePhoto(photoId, undefined, photo.photoUrl);
        if (response.success) {
          onPhotoLiked(); // Notify parent of the change
          // Sync with server state
          setPhotoStates(new Map(photoStates.set(photoId, { likes: response.likes, isLiked: response.isLiked })));
        } else {
          // Revert UI on failure
          setPhotoStates(new Map(photoStates.set(photoId, currentState)));
        }
      } catch (error) {
        // Revert UI on failure
        setPhotoStates(new Map(photoStates.set(photoId, currentState)));
      } finally {
        // Clear loading state
        setLikingPhotos(prev => {
          const newSet = new Set(prev);
          newSet.delete(photoId);
          return newSet;
        });
        // Clear timer
        debounceTimersRef.current.delete(photoId);
      }
    }, 300); // 300ms debounce

    debounceTimersRef.current.set(photoId, timer);
  };

  return (
    <div className="absolute inset-0 bg-black z-[999999] flex flex-col">
      <button onClick={onClose} className="fixed top-4 right-4 z-[1000000] w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/40 transition-colors">
        <CloseIcon className="w-6 h-6 text-white" />
      </button>

      <div 
        ref={containerRef} 
        className="flex-1 overflow-x-auto snap-x snap-mandatory no-scrollbar"
        style={{ scrollBehavior: 'auto' }} // Disable smooth scrolling for initial jump
      >
        <div className="flex h-full">
          {photos.map((photo) => {
            const state = photoStates.get(photo.id) || { likes: photo.likes, isLiked: photo.isLiked };
            const isLiking = likingPhotos.has(photo.id);
            return (
              <div key={photo.id} className="w-full h-full flex-shrink-0 snap-center">
                <MediaItem 
                  photo={photo} 
                  state={state} 
                  onLike={handleLike} 
                  onViewProfile={onViewProfile} 
                  isLiking={isLiking}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};



export default FullScreenPhotoViewer;

