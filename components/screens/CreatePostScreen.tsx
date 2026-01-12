import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CloseIcon, RefreshIcon, ChevronLeftIcon, SendIcon } from '../icons';
import { ToastType, User } from '../../types';
import { api } from '../../services/api';

interface CreatePostScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onPostComplete: (updatedUser: User) => void;
  addToast: (type: ToastType, message: string) => void;
  currentUser: User;
  initialMusic: any;
}

const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
});

const CreatePostScreen: React.FC<CreatePostScreenProps> = ({ isOpen, onClose, onPostComplete, addToast }) => {
  const [isPosting, setIsPosting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const [mode, setMode] = useState<'photo' | 'video'>('video');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: 'image' | 'video'; blob: Blob } | null>(null);
  const [isStreamReady, setIsStreamReady] = useState(false);

  const startCamera = useCallback(async () => {
    if (!isOpen) return;

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
    }

    setIsStreamReady(false);

    try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode },
            audio: true 
        });
        
        setStream(mediaStream);
    } catch (err) {
        console.error("[Camera] Error:", err);
        addToast(ToastType.Error, "Erro ao acessar câmera.");
    }
  }, [isOpen, facingMode]);

  useEffect(() => {
    if (isOpen) {
        startCamera();
    } else {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setMediaPreview(null);
        setIsRecording(false);
        setIsStreamReady(false);
    }
  }, [isOpen, facingMode]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && stream && !mediaPreview) {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            video.play().catch(e => console.log("Play error", e));
            setIsStreamReady(true);
        };
    }
  }, [stream, mediaPreview]);

  const handleFlipCamera = () => {
    if (isRecording) return;
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || !isStreamReady) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
        if(blob) {
            setMediaPreview({ url: URL.createObjectURL(blob), type: 'image', blob });
        }
    }, 'image/jpeg', 0.8);
  };

  const startRecording = () => {
    if (!stream || !isStreamReady) return;
    setIsRecording(true);
    recordedChunksRef.current = [];
    
    try {
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
            ? 'video/webm;codecs=vp9' 
            : 'video/webm';

        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };
        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            setMediaPreview({ url: URL.createObjectURL(blob), type: 'video', blob });
        };
        mediaRecorderRef.current.start(100); 
    } catch (e) {
        setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
    setIsRecording(false);
  };

  const handleCapture = () => {
    if (!isStreamReady) return;
    if (mode === 'photo') takePhoto();
    else isRecording ? stopRecording() : startRecording();
  };

  const handlePost = async () => {
    if (isPosting || !mediaPreview) return;
    setIsPosting(true);
    try {
      const mediaDataUrl = await blobToBase64(mediaPreview.blob);
      const { success, user } = await api.createFeedPost({ mediaData: mediaDataUrl, type: mediaPreview.type });
      if (success && user) {
        addToast(ToastType.Success, "Post criado!");
        onPostComplete(user);
        onClose();
      }
    } catch (error) {
      addToast(ToastType.Error, "Erro ao postar.");
    } finally {
      setIsPosting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="relative flex-1 bg-black overflow-hidden">
        {mediaPreview ? (
          <div className="relative w-full h-full flex flex-col">
            {mediaPreview.type === 'image' ? (
              <img src={mediaPreview.url} className="flex-1 w-full h-full object-contain" />
            ) : (
              <video src={mediaPreview.url} autoPlay loop playsInline className="flex-1 w-full h-full object-contain" />
            )}
            <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-t from-black/80 to-transparent">
               <button onClick={() => setMediaPreview(null)} className="text-white font-bold px-6 py-3 rounded-full bg-white/20">Refazer</button>
               <button onClick={handlePost} disabled={isPosting} className="bg-[#FE2C55] text-white font-bold px-8 py-3 rounded-full disabled:opacity-50">{isPosting ? 'Enviando...' : 'Postar'}</button>
            </div>
          </div>
        ) : (
          <>
            <video ref={videoRef} playsInline muted className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} />
            {!isStreamReady && <div className="absolute inset-0 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div></div>}
            <div className="absolute top-0 left-0 right-0 p-4 pt-6 flex justify-between z-20">
              <button onClick={onClose} className="w-10 h-10 bg-black/20 backdrop-blur rounded-full flex items-center justify-center text-white"><CloseIcon className="w-6 h-6" /></button>
              <button onClick={handleFlipCamera} className="w-10 h-10 bg-black/20 backdrop-blur rounded-full flex items-center justify-center text-white"><RefreshIcon className="w-5 h-5" /></button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 pb-12 flex flex-col items-center bg-gradient-to-t from-black/60 to-transparent">
              <div className="flex gap-6 mb-8">
                <button onClick={() => setMode('photo')} className={`font-bold text-sm ${mode === 'photo' ? 'text-white' : 'text-white/60'}`}>FOTO</button>
                <button onClick={() => setMode('video')} className={`font-bold text-sm ${mode === 'video' ? 'text-white' : 'text-white/60'}`}>VÍDEO</button>
              </div>
              <button onClick={handleCapture} disabled={!isStreamReady} className="w-20 h-20 rounded-full border-[5px] border-white/40 flex items-center justify-center transition-all active:scale-95">
                <div className={`rounded-full transition-all duration-300 ${mode === 'video' ? (isRecording ? 'w-8 h-8 bg-red-500 rounded-sm' : 'w-16 h-16 bg-red-500') : 'w-16 h-16 bg-white'}`}></div>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CreatePostScreen;