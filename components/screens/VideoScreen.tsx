
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { HeartIcon, MessageIcon, ShareIcon, MusicIcon, CameraIcon, PlusIcon, CloseIcon, SendIcon, RefreshIcon } from '@/components/icons';
import { useTranslation } from '@/i18n';
import { api } from '@/services/api';
import { FeedPhoto, ToastType, User, Comment } from '@/types';
import { LoadingSpinner } from '@/components/Loading';
import { webSocketManager } from '@/services/websocket';

// Mock Data for Comments
const INITIAL_COMMENTS = [
  { id: '1', user: { name: 'João Silva', avatarUrl: 'https://picsum.photos/seed/joao/100' } as User, text: 'Que lugar lindo! 😍', timestamp: new Date().toISOString() },
  { id: '2', user: { name: 'Ana Paula', avatarUrl: 'https://picsum.photos/seed/ana/100' } as User, text: 'Adorei o vídeo!', timestamp: new Date().toISOString() }
];

const CommentModal = ({ isOpen, onClose, comments, onAddComment }: any) => {
    const { t } = useTranslation();
    const [text, setText] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            onAddComment(text);
            setText('');
        }
    };

    return (
        <div 
            className={`fixed bottom-0 left-0 right-0 z-50 w-full h-[60%] bg-[#1C1C1E]/90 backdrop-blur-xl rounded-t-2xl flex flex-col shadow-2xl border-t border-white/10 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0 pointer-events-auto' : 'translate-y-full pointer-events-none'}`}
        >
            <div className="flex-shrink-0 flex justify-center items-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-700 rounded-full"></div>
            </div>
            <div className="flex-shrink-0 flex justify-between items-center px-4 pb-3 border-b border-gray-800">
                <div className="w-8"></div>
                <h3 className="text-white font-bold text-sm">{t('comments.title', { count: comments.length })}</h3>
                <button onClick={onClose} className="w-8 flex justify-end">
                    <CloseIcon className="w-5 h-5 text-gray-400" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {comments.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <p className="text-sm">{t('comments.none')}</p>
                    </div>
                ) : (
                    comments.map((c: Comment) => (
                        <div key={c.id} className="flex items-start gap-3">
                            <img src={c.user.avatarUrl} className="w-8 h-8 rounded-full object-cover border border-white/10" alt={c.user.name} />
                            <div className="flex-1">
                                <p className="text-gray-400 text-xs font-bold mb-0.5">{c.user.name}</p>
                                <p className="text-white text-sm leading-snug">{c.text}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="flex-shrink-0 p-3 border-t border-gray-800 bg-[#1C1C1E] safe-area-bottom">
                <form onSubmit={handleSubmit} className="flex items-center gap-3">
                    <input 
                        ref={inputRef}
                        type="text" 
                        placeholder={t('comments.addPlaceholder')} 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="flex-1 bg-[#2C2C2E] text-white text-sm py-2.5 px-4 rounded-full outline-none placeholder-gray-500"
                    />
                    <button type="submit" disabled={!text.trim()} className={`w-10 h-10 rounded-full flex items-center justify-center ${text.trim() ? 'bg-purple-600 text-white' : 'bg-[#2C2C2E] text-gray-500'}`}>
                        <SendIcon className="w-4 h-4 ml-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
});

const CameraCaptureScreen = ({ onClose, onPost, addToast }: { onClose: () => void; onPost: (blob: Blob, type: 'image' | 'video') => Promise<void>; addToast: (type: ToastType, message: string) => void; }) => {
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [mode, setMode] = useState<'photo' | 'video'>('photo');
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaPreview, setMediaPreview] = useState<{ url: string; type: 'image' | 'video'; blob: Blob } | null>(null);
    const [isPosting, setIsPosting] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);

    const startCamera = useCallback(async () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: mode === 'video' });
            setStream(mediaStream);
        } catch (err) {
            addToast(ToastType.Error, t('videoScreen.cameraError'));
            onClose();
        }
    }, [facingMode, mode, addToast, onClose, stream, t]);

    useEffect(() => {
        startCamera();
        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, [facingMode, mode, startCamera]);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const handleCapture = () => {
        const video = videoRef.current;
        if (!video) return;

        if (mode === 'photo') {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                if (facingMode === 'user') {
                    ctx.translate(canvas.width, 0);
                    ctx.scale(-1, 1);
                }
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(blob => {
                    if (blob) setMediaPreview({ url: URL.createObjectURL(blob), type: 'image', blob });
                }, 'image/jpeg');
            }
        } else {
            if (isRecording) {
                mediaRecorderRef.current?.stop();
                setIsRecording(false);
            } else if (stream) {
                setIsRecording(true);
                recordedChunksRef.current = [];
                mediaRecorderRef.current = new MediaRecorder(stream);
                mediaRecorderRef.current.ondataavailable = e => {
                    if (e.data.size > 0) recordedChunksRef.current.push(e.data);
                };
                mediaRecorderRef.current.onstop = () => {
                    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                    setMediaPreview({ url: URL.createObjectURL(blob), type: 'video', blob });
                };
                mediaRecorderRef.current.start();
            }
        }
    };

    const handlePost = async () => {
        if (isPosting || !mediaPreview) return;
        setIsPosting(true);
        await onPost(mediaPreview.blob, mediaPreview.type);
        setIsPosting(false);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black font-sans animate-in slide-in-from-bottom duration-300">
             {mediaPreview ? (
                <div className="absolute inset-0 flex flex-col">
                    {mediaPreview.type === 'image' ? (
                        <img src={mediaPreview.url} className="w-full h-full object-contain" alt="Preview"/>
                    ) : (
                        <video src={mediaPreview.url} autoPlay loop playsInline className="w-full h-full object-contain" />
                    )}
                     <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-t from-black/80 to-transparent">
                        <button onClick={() => setMediaPreview(null)} className="text-white font-bold px-6 py-3 rounded-full bg-white/20">{t('common.redo')}</button>
                        <button onClick={handlePost} disabled={isPosting} className="bg-[#FE2C55] text-white font-bold px-8 py-3 rounded-full disabled:opacity-50">
                            {isPosting ? t('common.sending') : t('common.post')}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} />
                    <div className="absolute top-0 left-0 right-0 p-4 pt-12 flex justify-between items-start z-20">
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white"><CloseIcon className="w-6 h-6" /></button>
                        <button className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 text-white text-xs font-bold border border-white/10"><MusicIcon className="w-3 h-3" /><span>{t('videoScreen.addMusic')}</span></button>
                        <button onClick={() => setFacingMode(p => p === 'user' ? 'environment' : 'user')} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white"><RefreshIcon className="w-5 h-5" /></button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 z-20 text-white pb-8 pt-20 px-6 flex flex-col items-center justify-end bg-gradient-to-t from-black/90 via-transparent to-transparent">
                        <div className="flex gap-8 mb-8 text-sm font-bold tracking-wide">
                            <button onClick={() => setMode('photo')} className={mode === 'photo' ? 'text-white scale-110' : 'text-white/60'}>{t('videoScreen.photo')}</button>
                            <button onClick={() => setMode('video')} className={mode === 'video' ? 'text-white scale-110' : 'text-white/60'}>{t('videoScreen.video')}</button>
                        </div>
                        <button onClick={handleCapture} className="w-[72px] h-[72px] rounded-full border-[4px] border-white flex items-center justify-center active:scale-95 transition-transform mb-4">
                            <div className={`rounded-full transition-all duration-300 ${mode === 'video' ? (isRecording ? 'w-8 h-8 bg-[#ff3b5c] rounded-sm' : 'w-14 h-14 bg-red-500') : 'w-14 h-14 bg-white'}`}></div>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

const VideoPlayer = ({ video, isActive }: { video: FeedPhoto; isActive: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (videoRef.current) {
            if (isActive) {
                videoRef.current.play().catch(() => setIsPlaying(false));
            } else {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
            }
        }
    }, [isActive]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play().catch(() => {});
        }
    };
    
    return (
        <div className="relative w-full h-full bg-black" onClick={togglePlay}>
            <video
                ref={videoRef}
                className="w-full h-full object-cover"
                src={video.mediaUrl}
                loop playsInline muted
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10 pointer-events-none">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <svg className="w-8 h-8 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                </div>
            )}
        </div>
    );
};

const VideoScreen = ({ addToast, currentUser }: { addToast: (type: ToastType, message: string) => void, currentUser: User }) => {
    const { t } = useTranslation();
    const [videos, setVideos] = useState<FeedPhoto[]>([]);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isCommentOpen, setIsCommentOpen] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
    const containerRef = useRef<HTMLDivElement>(null);

    const fetchVideos = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getFeedVideos();
            setVideos(data);
        } catch (e) {
            addToast(ToastType.Error, t('videoScreen.loadError'));
        } finally {
            setIsLoading(false);
        }
    }, [addToast, t]);

    useEffect(() => {
        fetchVideos();
    }, [fetchVideos]);

    useEffect(() => {
        const handleNewPost = (newPost: FeedPhoto) => {
            setVideos((prevVideos: FeedPhoto[]) => {
                if (prevVideos.some(v => v.id === newPost.id)) {
                    return prevVideos;
                }
                return [newPost, ...prevVideos];
            });
            if (currentUser && newPost.user.id !== currentUser.id) {
                addToast(ToastType.Info, t('videoScreen.newPostToast', { userName: newPost.user.name }));
            }
        };

        webSocketManager.on('feed:newPost', handleNewPost);

        return () => {
            webSocketManager.off('feed:newPost', handleNewPost);
        };
    }, [addToast, currentUser, t]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
                        setCurrentVideoIndex(index);
                    }
                });
            },
            { threshold: 0.5 }
        );

        const elements = containerRef.current?.childNodes;
        if (elements) {
            elements.forEach((el: ChildNode) => observer.observe(el as Element));
        }

        return () => observer.disconnect();
    }, [videos]);

    const handleLike = (videoId: string, index: number) => {
        const newVideos = [...videos];
        const video = newVideos[index];
        video.isLiked = !video.isLiked;
        video.likes += video.isLiked ? 1 : -1;
        setVideos(newVideos);
        api.likePost(videoId).catch(() => {
            // Revert on error
            video.isLiked = !video.isLiked;
            video.likes += video.isLiked ? 1 : -1;
            setVideos([...videos]);
        });
    };
    
    const handleAddComment = (text: string) => {
        const currentVideo = videos[currentVideoIndex];
        if (!currentVideo) return;
        
        api.addComment(currentVideo.id, text).then(res => {
            if (res.success) {
                const newVideos = [...videos];
                newVideos[currentVideoIndex].commentCount++;
                setVideos(newVideos);
                setComments(prev => [res.comment, ...prev]);
            }
        });
    };

    const handlePost = async (blob: Blob, type: 'image' | 'video') => {
        addToast(ToastType.Info, t('videoScreen.posting'));
        try {
            const mediaData = await blobToBase64(blob);
            const { success } = await api.createFeedPost({ mediaData, type, caption: 'Meu novo post!' });
            if (success) {
                addToast(ToastType.Success, t('videoScreen.postSuccess'));
                setIsCameraOpen(false);
                fetchVideos(); // Refresh feed
            }
        } catch (e) {
            addToast(ToastType.Error, t('videoScreen.postError'));
        }
    };
    
    const currentVideo = videos[currentVideoIndex];

    return (
        <div className="relative w-full h-full bg-black overflow-hidden font-sans">
            {isCameraOpen && <CameraCaptureScreen onClose={() => setIsCameraOpen(false)} onPost={handlePost} addToast={addToast} />}
            
            <div ref={containerRef} className="w-full h-full snap-y snap-mandatory overflow-y-scroll no-scrollbar">
                {isLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <LoadingSpinner />
                    </div>
                ) : (
                    videos.map((video: FeedPhoto, index: number) => (
                        <div key={video.id} data-index={index} className="w-full h-full snap-start shrink-0 relative">
                            <VideoPlayer video={video} isActive={index === currentVideoIndex} />
                        </div>
                    ))
                )}
            </div>
            
            {currentVideo && (
                <>
                    <div className="absolute top-0 left-0 right-0 pt-10 px-4 flex justify-between items-center z-20 pointer-events-none">
                        <h1 className="text-white font-bold text-lg drop-shadow-md">{t('videoScreen.title')}</h1>
                        <button onClick={() => setIsCameraOpen(true)} className="bg-white/10 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center text-white pointer-events-auto"><CameraIcon className="w-6 h-6" /></button>
                    </div>

                    <div className="absolute bottom-20 right-2 flex flex-col items-center gap-5 z-20 pb-4 pointer-events-none">
                        <div className="relative mb-3 pointer-events-auto">
                            <img src={currentVideo.user.avatarUrl} className="w-[50px] h-[50px] rounded-full border-2 border-white object-cover" alt={currentVideo.user.name} />
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#FE2C55] w-5 h-5 rounded-full flex items-center justify-center"><PlusIcon className="w-3 h-3 text-white" strokeWidth={4} /></div>
                        </div>
                        <button onClick={() => handleLike(currentVideo.id, currentVideoIndex)} className="flex flex-col items-center gap-1 pointer-events-auto">
                            <HeartIcon className={`w-9 h-9 text-white transition-colors ${currentVideo.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                            <span className="text-white text-[13px] font-bold">{currentVideo.likes.toLocaleString()}</span>
                        </button>
                        <button onClick={() => setIsCommentOpen(true)} className="flex flex-col items-center gap-1 pointer-events-auto">
                            <MessageIcon className="w-9 h-9 text-white" />
                            <span className="text-white text-[13px] font-bold">{currentVideo.commentCount.toLocaleString()}</span>
                        </button>
                        <button className="flex flex-col items-center gap-1 pointer-events-auto">
                            <ShareIcon className="w-8 h-8 text-white" />
                            <span className="text-white text-[11px] font-bold">{t('common.share')}</span>
                        </button>
                    </div>

                    <div className="absolute bottom-20 left-4 right-20 z-20 pointer-events-none">
                        <h3 className="text-white font-bold text-[17px] mb-2 pointer-events-auto">@{currentVideo.user.name.replace(/\s/g, '')}</h3>
                        <p className="text-white text-sm leading-snug pointer-events-auto">{currentVideo.description}</p>
                        <div className="flex items-center gap-2 mt-3 text-white text-xs"><MusicIcon className="w-3 h-3" /><span>{currentVideo.musicTitle}</span></div>
                    </div>
                </>
            )}

            <CommentModal isOpen={isCommentOpen} onClose={() => setIsCommentOpen(false)} comments={comments} onAddComment={handleAddComment} />
        </div>
    );
};

export default VideoScreen;
