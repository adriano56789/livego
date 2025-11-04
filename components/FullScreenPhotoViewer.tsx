import React, { useState, useEffect, useRef } from 'react';
import { FeedPhoto, User } from '../types';
import { CloseIcon, HeartIcon } from './icons';
import { api } from '../services/api';

interface FullScreenPhotoViewerProps {
  photos: FeedPhoto[];
  initialIndex: number;
  onClose: () => void;
  onViewProfile: (user: User) => void;
  onPhotoLiked: () => void;
}

const FullScreenPhotoViewer: React.FC<FullScreenPhotoViewerProps> = ({ photos, initialIndex, onClose, onViewProfile, onPhotoLiked }) => {
  const [photoStates, setPhotoStates] = useState(new Map(photos.map(p => [p.id, { likes: p.likes, isLiked: p.isLiked }])));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the initial photo when the component mounts
    if (containerRef.current) {
      const element = containerRef.current.children[initialIndex] as HTMLElement;
      if (element) {
        element.scrollIntoView();
      }
    }
  }, [initialIndex]);

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
    <div className="absolute inset-0 bg-black z-[100] flex flex-col no-scrollbar" ref={containerRef} style={{ scrollSnapType: 'y mandatory', overflowY: 'scroll' }}>
      <button onClick={onClose} className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/40 rounded-full flex items-center justify-center">
        <CloseIcon className="w-6 h-6 text-white" />
      </button>

      {photos.map((photo) => {
        const state = photoStates.get(photo.id) || { likes: photo.likes, isLiked: photo.isLiked };
        return (
          <div key={photo.id} className="w-full h-full flex-shrink-0 relative flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" style={{ scrollSnapAlign: 'start' }}>
            {photo.type === 'video' ? (
                <video src={photo.photoUrl} className="w-full h-full object-cover" autoPlay loop playsInline />
            ) : (
                <img src={photo.photoUrl} alt="Full screen view" className="w-full h-full object-cover" />
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
              <div className="flex justify-between items-center">
                <button onClick={() => onViewProfile(photo.user)} className="flex items-center space-x-2">
                  <img src={photo.user.avatarUrl} alt={photo.user.name} className="w-10 h-10 rounded-full object-cover border-2 border-white bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" />
                  <span className="font-bold text-white text-lg">{photo.user.name}</span>
                </button>
                <div className="flex flex-col items-center space-y-2">
                  <button onClick={() => handleLike(photo.id)}>
                    <HeartIcon 
                        className={`w-10 h-10 transition-colors ${state.isLiked ? 'text-red-500' : 'text-white'}`} 
                        fill={state.isLiked ? 'currentColor' : 'none'} 
                        stroke="currentColor" 
                        strokeWidth={1.5} 
                    />
                  </button>
                  <span className="text-white font-bold">{state.likes.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FullScreenPhotoViewer;
