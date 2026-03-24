import React, { useRef, useEffect, useState } from 'react';
import { webRTCService } from '../services/webrtcService.js';
import { beautyWebRTCIntegration } from '../services/BeautyWebRTCIntegration';

interface LiveVideoPlayerProps {
  streamer: any;
  currentUser: any;
  isBroadcaster: boolean;
  streamUrl?: string;
  onVideoReady?: () => void;
  onVideoError?: (error: string) => void;
  className?: string;
}

/**
 * Componente otimizado de player de vídeo para LiveGo
 * Funciona tanto para broadcasting quanto para viewing
 */
const LiveVideoPlayer: React.FC<LiveVideoPlayerProps> = ({
  streamer,
  currentUser,
  isBroadcaster,
  streamUrl,
  onVideoReady,
  onVideoError,
  className = "absolute inset-0 w-full h-full object-cover z-0"
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setupVideo = async () => {
      const videoEl = videoRef.current;
      if (!videoEl) return;

      console.log(`Configurando vídeo para usuário: ${currentUser?.id || currentUser?.name || 'unknown'} | Broadcaster: ${isBroadcaster} | Stream: ${streamer.id}`);

      setIsLoading(true);
      setIsVideoPlaying(false);

      // Reset do elemento de vídeo
      videoEl.pause();
      videoEl.srcObject = null;
      videoEl.removeAttribute('src');
      videoEl.load();

      try {
        if (isBroadcaster) {
          // BROADCASTER - Configurar câmera local
          await setupBroadcasterVideo(videoEl);
        } else {
          // VIEWER - Configurar stream remoto
          await setupViewerVideo(videoEl);
        }
      } catch (error) {
        console.error(`Erro no setup do vídeo para usuário ${currentUser?.id || currentUser?.name || 'unknown'}:`, error);
        onVideoError?.('Falha ao configurar vídeo');
        setIsLoading(false);
      }
    };

    setupVideo();
  }, [isBroadcaster, streamer.id, streamUrl, currentUser?.id]);

  const setupBroadcasterVideo = async (videoEl: HTMLVideoElement) => {
    // Obter stream local do WebRTCService
    const localStream = webRTCService.getLocalStream();
    
    if (localStream) {
      videoEl.srcObject = localStream;
      videoEl.muted = true; // Evitar eco
      videoEl.volume = 0;
      
      // Inicializar sistema de beleza para o usuário atual
      try {
        console.log(`Iniciando beauty integration para usuário: ${currentUser?.id || currentUser?.name || 'unknown'}`);
        await beautyWebRTCIntegration.initialize(localStream);
      } catch (beautyError) {
        console.warn('Sistema de beleza não disponível:', beautyError);
      }
    } else {
      // Fallback: solicitar câmera diretamente para o usuário atual
      console.log(`Solicitando câmera para usuário: ${currentUser?.id || currentUser?.name || 'unknown'}`);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      videoEl.srcObject = stream;
      videoEl.muted = true;
    }

    videoEl.onloadeddata = () => {
      setIsVideoPlaying(true);
      setIsLoading(false);
      onVideoReady?.();
      videoEl.play().catch(e => console.warn('Auto-play bloqueado:', e));
    };
  };

  const setupViewerVideo = async (videoEl: HTMLVideoElement) => {
    // Usar streamUrl fornecida ou construir URL WebRTC para SRS
    let webrtcUrl = streamUrl;
    
    if (!webrtcUrl) {
      const srsWebrtcBase = import.meta.env?.VITE_SRS_WEBRTC_URL || 'webrtc://72.60.249.175/live';
      webrtcUrl = streamer.playbackUrl?.startsWith('webrtc://')
        ? streamer.playbackUrl
        : `${srsWebrtcBase}/${streamer.id}`;
    }

    console.log(`Viewer ${currentUser?.id || currentUser?.name || 'unknown'} conectando à stream: ${streamer.id}`);

    try {
      // Iniciar reprodução WebRTC
      const remoteStream = await webRTCService.startPlay(webrtcUrl);
      
      if (remoteStream) {
        videoEl.srcObject = remoteStream;
        videoEl.muted = false;
        videoEl.volume = 1.0;
        
        videoEl.onloadeddata = () => {
          setIsVideoPlaying(true);
          setIsLoading(false);
          onVideoReady?.();
          videoEl.play().catch(e => console.warn('Auto-play bloqueado:', e));
        };
        
        // Verificar se o vídeo está funcionando
        videoEl.onloadedmetadata = () => {
          if (videoEl.videoWidth === 0) {
            console.warn('Vídeo sem dimensões válidas');
            onVideoError?.('Vídeo inválido');
          }
        };
        
        videoEl.onerror = (e) => {
          console.error('Erro no elemento de vídeo:', e);
          onVideoError?.('Erro na reprodução');
        };
      } else {
        throw new Error('Stream remoto não disponível');
      }
    } catch (error) {
      console.error(`Falha no WebRTC para viewer ${currentUser?.id || currentUser?.name || 'unknown'}:`, error);
      
      // Tentar fallback com vídeo de demonstração
      if (streamer.demoVideoUrl) {
        videoEl.src = streamer.demoVideoUrl;
        videoEl.loop = true;
        videoEl.muted = false;
        
        videoEl.onloadeddata = () => {
          setIsVideoPlaying(true);
          setIsLoading(false);
          onVideoReady?.();
        };
      } else {
        setIsLoading(false);
        onVideoError?.('Nenhuma fonte de vídeo disponível');
      }
    }
  };

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      // Parar processamento de beleza se ativo
      if (beautyWebRTCIntegration.isBeautyActive()) {
        beautyWebRTCIntegration.stopBeautyProcessing();
      }
      
      // Limpar stream do vídeo
      const videoEl = videoRef.current;
      if (videoEl && videoEl.srcObject) {
        const stream = videoEl.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-black">
      {/* Indicador de loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">
              {isBroadcaster ? 'Iniciando câmera...' : 'Carregando transmissão...'}
            </p>
          </div>
        </div>
      )}
      
      {/* Elemento de vídeo */}
      <video
        ref={videoRef}
        className={className}
        playsInline
        muted={isBroadcaster}
        autoPlay={isBroadcaster}
        key={`${streamer.id}-${isBroadcaster}`}
      />
      
      {/* Indicador de status */}
      {!isVideoPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
          <div className="text-white text-center">
            <p className="text-lg mb-2">
              {isBroadcaster ? '📹 Câmera pronta' : '📺 Aguardando transmissão'}
            </p>
            <p className="text-sm text-gray-300">
              {isBroadcaster 
                ? 'Sua transmissão está configurada' 
                : 'O streamer ainda não iniciou'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveVideoPlayer;
