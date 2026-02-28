
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
}> = ({ photo, state, onLike, onViewProfile }) => {
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
                    console.log("Auto-play prevented:", error);
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
        <div className="w-full h-full flex-shrink-0 relative flex items-center justify-center bg-black snap-center">
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
                        <button onClick={() => onLike(photo.id)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                            <HeartIcon 
                                className={`w-8 h-8 transition-colors ${state.isLiked ? 'text-red-500' : 'text-white'}`} 
                                fill={state.isLiked ? 'currentColor' : 'none'} 
                                stroke="currentColor" 
                                strokeWidth={2} 
                            />
                        </button>
                        <span className="text-white font-medium text-sm drop-shadow-md">{state.likes.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FullScreenPhotoViewer: React.FC<FullScreenPhotoViewerProps> = ({ photos, initialIndex, onClose, onViewProfile, onPhotoLiked }) => {
  const [photoStates, setPhotoStates] = useState(new Map(photos.map(p => [p.id, { likes: p.likes, isLiked: p.isLiked }])));
  const containerRef = useRef<HTMLDivElement>(null);

  // Use layout effect to ensure scrolling happens before paint if possible to avoid flicker
  useEffect(() => {
    if (containerRef.current && photos[initialIndex]) {
        // Find the specific element by ID (safer than index if array mutates, though index is used here for simplicity)
        const element = containerRef.current.children[initialIndex] as HTMLElement;
        if (element) {
            element.scrollIntoView({ behavior: 'auto', block: 'center' }); 
        }
    }
  }, []); // Run once on mount

  const handleLike = async (photoId: string) => {
    const currentState = photoStates.get(photoId);
    if (!currentState) return;

    // Optimistic UI update
    const newIsLiked = !currentState.isLiked;
    const newLikes = newIsLiked ? currentState.likes + 1 : currentState.likes - 1;
    setPhotoStates(new Map(photoStates.set(photoId, { likes: newLikes, isLiked: newIsLiked })));

    // API call to persist the like
    try {
      const response = await api.likePhoto(photoId);
      if (response.success) {
        onPhotoLiked(); // Notify parent of the change
        // Sync with server state just in case there's a mismatch
        setPhotoStates(new Map(photoStates.set(photoId, { likes: response.likes, isLiked: response.isLiked })));
      } else {
        // Revert UI on failure
        setPhotoStates(new Map(photoStates.set(photoId, currentState)));
      }
    } catch (error) {
      console.error("Failed to like photo:", error);
      // Revert UI on failure
      setPhotoStates(new Map(photoStates.set(photoId, currentState)));
    }
  };
  
  return (
    <div className="absolute inset-0 bg-black z-[100] flex flex-col">
      <button onClick={onClose} className="fixed top-4 right-4 z-20 w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/40 transition-colors">
        <CloseIcon className="w-6 h-6 text-white" />
      </button>

      <div 
        ref={containerRef} 
        className="flex-1 overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        style={{ scrollBehavior: 'auto' }} // Disable smooth scrolling for initial jump
      >
          {photos.map((photo) => {
            const state = photoStates.get(photo.id) || { likes: photo.likes, isLiked: photo.isLiked };
            return (
                <MediaItem 
                    key={photo.id} 
                    photo={photo} 
                    state={state} 
                    onLike={handleLike} 
                    onViewProfile={onViewProfile} 
                />
            );
          })}
      </div>
    </div>
  );
};

export default FullScreenPhotoViewer;
