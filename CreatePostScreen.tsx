
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CloseIcon, MusicNoteIcon, CameraIcon as FlipCameraIcon, PlayIcon, BackIcon } from './components/icons';
import { ToastType, User, MusicTrack } from './types';
import { api } from './services/api';
import MusicSelectionModal from './components/MusicSelectionModal';

interface CreatePostScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onPostComplete: (updatedUser: User) => void;
  addToast: (type: ToastType, message: string) => void;
  currentUser: User;
  initialMusic: MusicTrack | null;
}

const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
});

const generateVideoThumbnail = (videoUrl: string): Promise<string> => new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.currentTime = 1;
    video.crossOrigin = 'anonymous';
    video.onloadeddata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg'));
        video.remove();
        canvas.remove();
    };
    video.onerror = () => resolve('');
});


const CreatePostScreen: React.FC<CreatePostScreenProps> = ({ isOpen, onClose, onPostComplete, addToast, currentUser, initialMusic }) => {
  const [description, setDescription] = useState('');

  // Função para limpar o formulário
  const resetForm = useCallback(() => {
    setDescription('');
    setMediaPreview(null);
    setIsPosting(false);
  }, []);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(initialMusic || null);
  const [isPosting, setIsPosting] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<'photo' | 'video'>('video');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: 'image' | 'video'; blob: Blob } | null>(null);
  const [isStreamReady, setIsStreamReady] = useState(false);

  useEffect(() => {
    if (initialMusic) {
        setSelectedMusic(initialMusic);
    }
  }, [initialMusic]);

  useEffect(() => {
    if (!isOpen) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setDescription('');
      setMediaPreview(null);
      setIsRecording(false);
      setRecordingTime(0);
      setIsStreamReady(false);
      return;
    }

    let isCancelled = false;
    const getStream = async () => {
      console.log('Iniciando configuração da câmera...');
      if (mediaStreamRef.current) {
        console.log('Parando stream existente...');
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsStreamReady(false);

      try {
        console.log('Solicitando acesso à câmera...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: true 
        });
        
        if (isCancelled) {
          console.log('Componente desmontado, limpando...');
          return stream.getTracks().forEach(t => t.stop());
        }

        console.log('Stream obtido com sucesso:', stream);
        mediaStreamRef.current = stream;

        if (videoRef.current) {
          console.log('Atribuindo stream ao elemento de vídeo...');
          videoRef.current.srcObject = stream;
          return new Promise<void>((resolve) => {
            if (!videoRef.current) return resolve();
            
            videoRef.current.onloadedmetadata = () => {
              console.log('Metadados do vídeo carregados');
              if (!isCancelled) {
                console.log('Vídeo pronto para reprodução');
                setIsStreamReady(true);
              }
              resolve();
            };
            
            videoRef.current.onerror = (e) => {
              console.error('Erro ao carregar vídeo:', e);
              resolve();
            };
          });
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Error accessing camera/mic:", err);
          addToast(ToastType.Error, "Câmera ou microfone não acessível.");
          onClose();
        }
      }
    };
    
    getStream();

    return () => {
      isCancelled = true;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      if (audioRef.current) {
          audioRef.current.pause();
      }
    };
  }, [isOpen, facingMode, addToast, onClose]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }
    if (selectedMusic?.url) {
      audioRef.current.src = selectedMusic.url;
    } else {
      audioRef.current.src = '';
    }
  }, [selectedMusic]);


  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleFlipCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
        if(blob) {
            setMediaPreview({ url: URL.createObjectURL(blob), type: 'image', blob });
        }
    }, 'image/jpeg');
  };

  const startRecording = () => {
    if (!mediaStreamRef.current) return;
    setIsRecording(true);
    setRecordingTime(0);
    recordedChunksRef.current = [];
    
    // Criar um novo stream apenas para gravação
    const streamForRecording = mediaStreamRef.current.clone();
    
    mediaRecorderRef.current = new MediaRecorder(streamForRecording, { 
      mimeType: 'video/webm',
      audioBitsPerSecond: 128000,
      videoBitsPerSecond: 2500000
    });
    
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };
    
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setMediaPreview({ url, type: 'video', blob });
      
      // Parar todas as tracks do stream de gravação
      streamForRecording.getTracks().forEach(track => track.stop());
    };
    
    mediaRecorderRef.current.start(100); // Coletar dados a cada 100ms

    if (audioRef.current && selectedMusic) {
      audioRef.current.play().catch(e => console.error("Falha ao reproduzir áudio:", e));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleCapture = () => {
    if (!isStreamReady) {
        addToast(ToastType.Info, "Aguarde a câmera iniciar.");
        return;
    }
    if (mode === 'photo') {
      takePhoto();
    } else {
      if (isRecording) stopRecording();
      else startRecording();
    }
  };

  const handlePost = async () => {
    if (isPosting || !mediaPreview) return;
    
    // Validar descrição
    if (!description.trim()) {
      addToast(ToastType.Info, "Por favor, adicione uma descrição ao seu post.");
      return;
    }
    
    setIsPosting(true);

    try {
      const mediaDataUrl = await blobToBase64(mediaPreview.blob);
      let thumbnailDataUrl;
      if (mediaPreview.type === 'video') {
        thumbnailDataUrl = await generateVideoThumbnail(mediaPreview.url);
      }
      
      const payload = {
        mediaData: mediaDataUrl,
        thumbnailData: thumbnailDataUrl,
        type: mediaPreview.type,
        description: description.trim(), // Garantir que a descrição está incluída
        musicId: selectedMusic?.id,
        musicTitle: selectedMusic?.title,
        musicArtist: selectedMusic?.artist,
        audioUrl: selectedMusic?.url,
        caption: description.trim(), // Adicionando também como caption para garantir compatibilidade
      };

      const { success, user } = await api.createFeedPost(payload);
      if (success && user) {
        addToast(ToastType.Success, "Postado com sucesso!");
        onPostComplete(user);
        resetForm();
        onClose();
      } else {
        throw new Error("Falha ao postar.");
      }
    } catch (error) {
      addToast(ToastType.Error, (error as Error).message || "Ocorreu um erro ao postar.");
      setIsPosting(false);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };
  
  const handleSelectMusic = (music: MusicTrack) => {
    setSelectedMusic(music);
    setIsMusicModalOpen(false);
  };

  return (
    <div
      className={`absolute inset-0 bg-black z-50 transition-opacity duration-300 flex flex-col ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="relative flex-1 bg-black overflow-hidden">
        {!isStreamReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="text-white text-lg">Carregando câmera...</div>
          </div>
        )}
        {mediaPreview ? (
          // Preview UI
          <>
            {mediaPreview.type === 'image' ? (
              <img src={mediaPreview.url} className="w-full h-full object-cover" alt="Preview" />
            ) : (
              <video src={mediaPreview.url} autoPlay loop className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 flex flex-col justify-between">
              <header className="flex justify-start">
                <button 
                  onClick={() => {
                    setMediaPreview(null);
                    resetForm();
                  }} 
                  className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                >
                  <BackIcon className="w-6 h-6" />
                </button>
              </header>
              <footer className="space-y-4">
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Adicione uma descrição..."
                    className="w-full bg-black/60 backdrop-blur-md text-white p-4 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent placeholder-gray-300 resize-none"
                    rows={3}
                    maxLength={2200}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-300 bg-black/50 px-2 py-1 rounded-full">
                    {description.length}/2200
                  </div>
                </div>
                <button 
                  onClick={handlePost} 
                  disabled={isPosting} 
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:transform-none"
                >
                  {isPosting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Postando...
                    </span>
                  ) : (
                    <span>Compartilhar</span>
                  )}
                </button>
              </footer>
            </div>
          </>
        ) : (
          // Capture UI
          <>
            <div className="relative w-full h-full">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              {isRecording && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                  {formatTime(recordingTime)}
                </div>
              )}
            </div>
            <header className="absolute top-0 left-0 right-0 p-4 flex justify-between z-20">
              <button onClick={onClose} className="w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white"><CloseIcon className="w-5 h-5" /></button>
              <button onClick={handleFlipCamera} className="w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white"><FlipCameraIcon className="w-5 h-5" /></button>
            </header>
            <div className="absolute top-16 left-0 right-0 px-4 z-10">
              <button onClick={() => setIsMusicModalOpen(true)} className="bg-black/50 backdrop-blur-md text-white font-semibold py-2 px-4 rounded-full flex items-center space-x-2 mx-auto">
                <MusicNoteIcon className="w-5 h-5" />
                <span>{selectedMusic ? selectedMusic.title : "Adicionar música"}</span>
              </button>
            </div>
            {isRecording && <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-red-500/80 text-white text-sm font-semibold px-3 py-1 rounded-full">{formatTime(recordingTime)}</div>}
            <footer className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center z-10">
              <div className="flex items-center space-x-8">
                <button onClick={() => setMode('photo')} className={`text-lg font-semibold ${mode === 'photo' ? 'text-white' : 'text-gray-500'}`}>Foto</button>
                <button onClick={() => setMode('video')} className={`text-lg font-semibold ${mode === 'video' ? 'text-white' : 'text-gray-500'}`}>Vídeo</button>
              </div>
              <div className="w-20 h-20 mt-4 flex items-center justify-center">
                <button onClick={handleCapture} disabled={!isStreamReady} className={`w-16 h-16 rounded-full border-4 border-white flex items-center justify-center transition-all ${isRecording ? 'bg-transparent animate-pulse' : 'bg-white/30'} ${!isStreamReady ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {isRecording && <div className="w-8 h-8 bg-red-500 rounded-md"></div>}
                </button>
              </div>
            </footer>
          </>
        )}
      </div>
      {isMusicModalOpen && <MusicSelectionModal onClose={() => setIsMusicModalOpen(false)} onSelect={handleSelectMusic} />}
    </div>
  );
};
export default CreatePostScreen;
