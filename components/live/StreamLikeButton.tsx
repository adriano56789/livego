import React, { useState, useEffect } from 'react';
import { HeartIcon } from '../icons';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';

interface StreamLikeButtonProps {
  streamId: string;
  userId: string;
  initialLikes?: number;
  className?: string;
}

const StreamLikeButton: React.FC<StreamLikeButtonProps> = ({
  streamId,
  userId,
  initialLikes = 0,
  className = ''
}) => {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Efeito para WebSocket em tempo real
  useEffect(() => {
    // Entrar na sala da stream para receber atualizações
    socketService.joinRoom(`stream_${streamId}`);

    // Listener para likes em tempo real
    const handleStreamLiked = (data: {
      streamId: string;
      userId: string;
      totalLikes: number;
      timestamp: string;
    }) => {
      if (data.streamId === streamId) {
        setLikes(data.totalLikes);
        
        // Animar coração se não for o próprio usuário
        if (data.userId !== userId) {
          triggerHeartAnimation();
        }
      }
    };

    const handleStreamUnliked = (data: {
      streamId: string;
      userId: string;
      totalLikes: number;
      timestamp: string;
    }) => {
      if (data.streamId === streamId) {
        setLikes(data.totalLikes);
      }
    };

    // Registrar listeners
    socketService.on('stream_liked', handleStreamLiked);
    socketService.on('stream_unliked', handleStreamUnliked);

    // Cleanup
    return () => {
      socketService.off('stream_liked', handleStreamLiked);
      socketService.off('stream_unliked', handleStreamUnliked);
    };
  }, [streamId, userId]);

  const triggerHeartAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handleLike = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      if (isLiked) {
        // Remover like
        const response = await api.unlikeStream(streamId, userId);
        if (response?.success) {
          setLikes(response.totalLikes);
          setIsLiked(false);
        }
      } else {
        // Dar like
        const response = await api.likeStream(streamId, userId);
        if (response?.success) {
          setLikes(response.totalLikes);
          setIsLiked(true);
          triggerHeartAnimation();
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Formatar número para exibição (K, M)
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={handleLike}
        disabled={isLoading}
        className={`
          relative flex items-center space-x-1 px-3 py-1.5 rounded-full
          transition-all duration-200 transform
          ${isLiked 
            ? 'bg-red-500 text-white scale-110' 
            : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
          ${isAnimating ? 'animate-pulse' : ''}
        `}
      >
        <HeartIcon
          className={`
            w-5 h-5 transition-all duration-300
            ${isLiked ? 'fill-current animate-pulse' : ''}
            ${isAnimating ? 'animate-bounce' : ''}
          `}
          fill={isLiked ? 'currentColor' : 'none'}
        />
        <span className="text-sm font-medium">
          {formatNumber(likes)}
        </span>
        
        {/* Animação de corações flutuantes */}
        {isAnimating && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <HeartIcon
                key={i}
                className="absolute text-red-500 animate-ping"
                style={{
                  width: '12px',
                  height: '12px',
                  left: `${20 + i * 10}px`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.6s'
                }}
                fill="currentColor"
              />
            ))}
          </div>
        )}
      </button>
      
      {/* Indicador de carregamento */}
      {isLoading && (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
    </div>
  );
};

export default StreamLikeButton;
