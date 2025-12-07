import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { FeedPhoto, User, MusicTrack } from '../types';
import { LoadingSpinner } from './Loading';
import { HeartIcon, MessageIcon, ShareIcon, MusicNoteIcon, PlayIcon, CameraIcon, PlusIcon } from './icons';
import CommentModal from './CommentModal';

const formatCount = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

interface VideoSlideProps {
    video: FeedPhoto;
    onViewProfile: (user: User) => void;
    onPhotoLiked: () => void;
    isActive: boolean;
    onOpenComments: (photo: FeedPhoto) => void;
    onViewMusic: (music: MusicTrack) => void;
    onFollowUser: (user: User) => void;
    onUseSound: (music: MusicTrack) => void;
}

const VideoSlide: React.FC<VideoSlideProps> = ({ video, onViewProfile, onPhotoLiked, isActive, onOpenComments, onViewMusic, onFollowUser, onUseSound }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showPlayIcon, setShowPlayIcon] = useState(false);
    const [isLiked, setIsLiked] = useState(video.isLiked);
    const [likeCount, setLikeCount] = useState(video.likes);

    const togglePlayback = useCallback(() => {
        const videoElement = videoRef.current;
        const audioElement = audioRef.current;

        if (videoElement) {
            if (videoElement.paused) {
                videoElement.play();
                audioElement?.play();
                setIsPlaying(true);
                setShowPlayIcon(false);
            } else {
                videoElement.pause();
                audioElement?.pause();
                setIsPlaying(false);
                setShowPlayIcon(true);
            }
        }
    }, []);
    
    useEffect(() => {
        const videoElement = videoRef.current;
        const audioElement = audioRef.current;
        
        if (!videoElement) return;

        if (isActive) {
            const playPromise = videoElement.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    audioElement?.play();
                    setIsPlaying(true);
                    setShowPlayIcon(false);
                }).catch(error => {
                    console.warn("Video autoplay prevented:", error);
                    setIsPlaying(false);
                    setShowPlayIcon(true);
                });
            }
        } else {
            videoElement.pause();
            videoElement.currentTime = 0;
            if(audioElement) audioElement.pause();
            if (audioElement) audioElement.currentTime = 0;
            setIsPlaying(false);
        }

    }, [isActive]);

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const originalState = { isLiked, likeCount };
        
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

        try {
            const response = await api.likePhoto(video.id);
            if (response.success) {
                onPhotoLiked();
                setIsLiked(response.isLiked);
                setLikeCount(response.likes);
            } else {
                throw new Error("API call failed");
            }
        } catch (error) {
            console.error("Failed to toggle like:", error);
            setIsLiked(originalState.isLiked);
            setLikeCount(originalState.likeCount);
        }
    };

    const handleViewMusicClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (video.musicId && video.musicTitle && video.musicArtist && video.audioUrl) {
            onViewMusic({
                id: video.musicId,
                title: video.musicTitle,
                artist: video.musicArtist,
                url: video.audioUrl,
            });
        }
    };

    const handleUseSoundClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const musicTrack: MusicTrack = {
            id: video.musicId || `original-${video.user.id}`,
            title: video.musicTitle || `Som original - ${video.user.name}`,
            artist: video.musicArtist || video.user.name,
            url: video.audioUrl || '',
        };
        onUseSound(musicTrack);
    };

    // Debug: Verificar os dados do vídeo
    console.log('Dados do vídeo:', {
        id: video.id,
        description: (video as any).description,
        caption: (video as any).caption,
        photoUrl: video.photoUrl,
        type: video.type,
        user: video.user.name,
        hasAudio: !!video.audioUrl
    });

    // Função para lidar com erros de carregamento de vídeo
    const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        console.error('Erro ao carregar vídeo:', e);
        const videoElement = e.currentTarget;
        
        // Tentar carregar o thumbnail como fallback
        if (video.thumbnailUrl) {
            console.log('Tentando carregar thumbnail como fallback');
            const img = document.createElement('img');
            img.src = video.thumbnailUrl;
            img.className = 'absolute inset-0 w-full h-full object-cover';
            img.onerror = () => {
                console.error('Falha ao carregar thumbnail');
            };
            
            // Substituir o vídeo pela imagem
            if (videoElement.parentNode) {
                videoElement.parentNode.insertBefore(img, videoElement);
                videoElement.style.display = 'none';
            }
        }
        
        // Mostrar botão de play para tentar novamente
        setShowPlayIcon(true);
    };

    return (
        <div className="relative h-full w-full snap-center bg-black" onClick={togglePlayback}>
            {video.type === 'video' ? (
                <div className="relative w-full h-full">
                    <video
                        ref={videoRef}
                        src={video.photoUrl}
                        loop
                        playsInline
                        muted={!video.audioUrl} // Só desativa o mute se houver áudio separado
                        className="absolute inset-0 w-full h-full object-cover z-0"
                        poster={video.thumbnailUrl || ''}
                        onError={handleVideoError}
                        onCanPlay={() => {
                            // Tentar reproduzir quando o vídeo estiver pronto
                            const playPromise = videoRef.current?.play();
                            if (playPromise !== undefined) {
                                playPromise.catch(error => {
                                    console.warn('Reprodução automática bloqueada:', error);
                                    setShowPlayIcon(true);
                                });
                            }
                        }}
                    />
                    {video.audioUrl && (
                        <audio 
                            ref={audioRef} 
                            src={video.audioUrl} 
                            loop 
                            onError={(e) => console.error('Erro ao carregar áudio:', e)}
                        />
                    )}
                </div>
            ) : (
                <img 
                    src={video.photoUrl} 
                    alt="User content" 
                    className="w-full h-full object-cover bg-black" 
                />
            )}
            
            {video.type === 'video' && showPlayIcon && !isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                    <PlayIcon className="w-20 h-20 text-white/70" />
                </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-20 text-white bg-gradient-to-t from-black/50 to-transparent flex justify-between items-end">
                {/* Left Side Info */}
                <div className="flex-1 min-w-0 space-y-2">
                    <button onClick={(e) => { e.stopPropagation(); onViewProfile(video.user); }} className="font-bold text-lg">@{video.user.name}</button>
                    <p className="text-sm whitespace-pre-line">{(video as any).description || (video as any).caption || 'Sem descrição'}</p>
                    <button onClick={handleViewMusicClick} className="flex items-center space-x-2">
                        <MusicNoteIcon className="w-4 h-4"/>
                        <p className="text-sm truncate">{video.musicTitle ? `${video.musicTitle} - ${video.musicArtist}` : `Som original - ${video.user.name}`}</p>
                    </button>
                </div>

                {/* Right Side Actions */}
                <div className="flex flex-col items-center space-y-4 flex-shrink-0 pl-2">
                    <div className="relative w-12 h-12 mb-2">
                         <button onClick={(e) => { e.stopPropagation(); onViewProfile(video.user);}} className="w-full h-full rounded-full p-1 border-2 border-white">
                            <img src={video.user.avatarUrl} alt={video.user.name} className="w-full h-full rounded-full object-cover" />
                         </button>
                         <button onClick={(e) => { e.stopPropagation(); onFollowUser(video.user); }} className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white">
                             <PlusIcon className="w-4 h-4"/>
                         </button>
                    </div>
                    <button onClick={handleLike} className="flex flex-col items-center space-y-1">
                        <div className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center">
                            <HeartIcon className={`w-8 h-8 transition-colors ${isLiked ? 'text-red-500' : 'text-white'}`} fill={isLiked ? 'currentColor' : 'none'} />
                        </div>
                        <span className="text-xs font-semibold">{formatCount(likeCount)}</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onOpenComments(video); }} className="flex flex-col items-center space-y-1">
                        <div className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center">
                            <MessageIcon className="w-8 h-8 text-white"/>
                        </div>
                        <span className="text-xs font-semibold">{formatCount(video.commentCount)}</span>
                    </button>
                    <button className="flex flex-col items-center space-y-1">
                        <div className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center">
                            <ShareIcon className="w-8 h-8 text-white"/>
                        </div>
                        <span className="text-xs font-semibold">Compartilhar</span>
                    </button>

                    {/* Spinning Disc */}
                    <button onClick={handleUseSoundClick} className="w-12 h-12 bg-black rounded-full flex items-center justify-center animate-spin-disc p-2 border-2 border-gray-800">
                         <img src={video.user.avatarUrl} alt={video.user.name} className="w-full h-full rounded-full object-cover" />
                    </button>
                </div>
            </div>
        </div>
    );
};

interface VideoScreenProps {
  currentUser: User;
  onViewProfile: (user: User) => void;
  onPhotoLiked: () => void;
  onViewMusic: (music: MusicTrack) => void;
  onFollowUser: (user: User) => void;
  lastPhotoLikeUpdate: number;
  onOpenPhotoViewer: (photos: FeedPhoto[], index: number) => void;
  onUseSound: (music: MusicTrack) => void;
}

const VideoScreen: React.FC<VideoScreenProps> = ({ currentUser, onViewProfile, onPhotoLiked, onViewMusic, onFollowUser, lastPhotoLikeUpdate, onOpenPhotoViewer, onUseSound }) => {
    const [feed, setFeed] = useState<FeedPhoto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const observer = useRef<IntersectionObserver | null>(null);
    const [commentModalState, setCommentModalState] = useState<{ isOpen: boolean; photo: FeedPhoto | null }>({ isOpen: false, photo: null });

    const loadVideos = useCallback(async () => {
        setIsLoading(true);
        try {
            // Busca o feed de vídeos da API
            const videos = await api.getPhotoFeed();
            console.log('Vídeos recebidos da API:', videos);
            
            // Filtra apenas os vídeos (não fotos)
            const videoFeed = videos.filter(photo => {
                const isVideo = photo.type === 'video';
                console.log(`Vídeo ID: ${photo.id}, Tipo: ${photo.type}, URL: ${photo.photoUrl}, Thumbnail: ${photo.thumbnailUrl}`);
                return isVideo;
            });
            
            console.log('Vídeos filtrados:', videoFeed);
            setFeed(videoFeed);
        } catch (error) {
            console.error('Erro ao carregar vídeos:', error);
            // Se houver erro, tenta carregar os vídeos do usuário como fallback
            if (currentUser?.obras) {
                const userVideos = currentUser.obras
                    .filter(obra => obra.type === 'video')
                    .map(obra => ({
                        id: obra.id,
                        photoUrl: obra.url,
                        type: obra.type as 'video',
                        thumbnailUrl: obra.thumbnailUrl,
                        user: currentUser,
                        likes: currentUser.curtidas?.filter(l => l.obra.id === obra.id).length || 0,
                        isLiked: currentUser.curtidas?.some(l => l.obra.id === obra.id) || false,
                        commentCount: 0,
                        musicId: obra.musicId,
                        musicTitle: obra.musicTitle,
                        musicArtist: obra.musicArtist,
                        audioUrl: obra.audioUrl,
                        description: (obra as any).description || '',  // Garantindo que description exista
                        caption: (obra as any).caption || ''           // Garantindo que caption exista
                    } as FeedPhoto)); // Forçando o tipo para incluir as propriedades opcionais
                setFeed(userVideos);
            } else {
                setFeed([]);
            }
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        loadVideos();
    }, [loadVideos, lastPhotoLikeUpdate]);
    
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
                const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
                setActiveIndex(index);
            }
        });
    };

    useEffect(() => {
        observer.current = new IntersectionObserver(handleIntersection, {
            root: null,
            rootMargin: '0px',
            threshold: 0.7
        });

        return () => observer.current?.disconnect();
    }, []);

    const slideRefs = useCallback((node: HTMLDivElement) => {
        if (node) {
            observer.current?.observe(node);
        }
    }, []);

    const handleOpenComments = (photo: FeedPhoto) => {
        setCommentModalState({ isOpen: true, photo });
    };

    const handleCloseComments = () => {
        setCommentModalState({ isOpen: false, photo: null });
    };

    const handleCommentPosted = (photoId: string) => {
        setFeed(prevFeed =>
            prevFeed.map(photo =>
                photo.id === photoId
                    ? { ...photo, commentCount: (photo.commentCount || 0) + 1 }
                    : photo
            )
        );
    };

    return (
        <div className="bg-black h-full text-white">
            {isLoading ? (
                <div className="flex items-center justify-center h-full">
                    <LoadingSpinner />
                </div>
            ) : feed.length > 0 ? (
                <div className="relative h-full overflow-y-auto snap-y snap-mandatory no-scrollbar">
                    {feed.map((item, index) => (
                        <div key={item.id} ref={slideRefs} data-index={index} className="h-full w-full flex-shrink-0 snap-center">
                            <VideoSlide
                                video={item}
                                onViewProfile={onViewProfile}
                                onPhotoLiked={onPhotoLiked}
                                isActive={index === activeIndex}
                                onOpenComments={handleOpenComments}
                                onViewMusic={onViewMusic}
                                onFollowUser={onFollowUser}
                                onUseSound={onUseSound}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
                    <CameraIcon className="w-16 h-16 mb-4" />
                    <p className="text-lg font-semibold">Nenhuma publicação ainda</p>
                    <p className="text-sm">Os vídeos e fotos que você postar aparecerão aqui.</p>
                </div>
            )}
             {commentModalState.isOpen && commentModalState.photo && (
                <CommentModal
                    photo={commentModalState.photo}
                    currentUser={currentUser}
                    onClose={handleCloseComments}
                    onCommentPosted={handleCommentPosted}
                />
            )}
        </div>
    );
};

export default VideoScreen;