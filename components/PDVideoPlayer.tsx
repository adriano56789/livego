import React, { useRef, useEffect, useState } from 'react';
import { webRTCService } from '../services/webrtcService.js';

interface PDVideoPlayerProps {
  streamer: any;
  currentUser: any;
  streamUrl?: string;
  onVideoReady?: () => void;
  onVideoError?: (error: string) => void;
  className?: string;
}

/**
 * PD Player - Player Limpo para Sala de Transmissão
 * Apenas vídeo, sem interferências - estilo TikTok
 */
const PDVideoPlayer: React.FC<PDVideoPlayerProps> = ({
  streamer,
  currentUser,
  streamUrl,
  onVideoReady,
  onVideoError,
  className = "absolute inset-0 w-full h-full object-cover z-0"
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setupVideo = async () => {
      const videoEl = videoRef.current;
      if (!videoEl) return;

      setIsLoading(true);

      // Reset do vídeo
      videoEl.pause();
      videoEl.srcObject = null;
      videoEl.removeAttribute('src');
      videoEl.load();

      try {
        // Apenas reproduzir vídeo
        await setupVideoPlayer(videoEl);
        setIsLoading(false);
        onVideoReady?.();
      } catch (error) {
        console.error(`PD Player - Falha:`, error);
        onVideoError?.('Player não disponível');
        setIsLoading(false);
      }
    };

    setupVideo();
  }, [streamer.id, streamUrl]);

  const setupVideoPlayer = async (videoEl: HTMLVideoElement) => {
    // Construir URL
    let videoUrl = streamUrl;
    
    if (!videoUrl) {
      if (streamer.playbackUrl) {
        videoUrl = streamer.playbackUrl;
      } else {
        const srsWebrtcBase = import.meta.env?.VITE_SRS_WEBRTC_URL || 'webrtc://72.60.249.175/live';
        videoUrl = `${srsWebrtcBase}/${streamer.id}`;
      }
    }

    console.log(`PD Player - Tentando reproduzir: ${videoUrl}`);

    // Para host: mostrar câmera local primeiro
    if (currentUser.id === streamer.hostId) {
      console.log('PD Player - Host detectado, tentando câmera local');
      const localStream = webRTCService.getLocalStream();
      
      if (localStream) {
        console.log('PD Player - Usando stream local da câmera');
        videoEl.srcObject = localStream;
        videoEl.muted = true; // Host não ouve próprio áudio
        
        videoEl.onloadeddata = () => {
          videoEl.play().catch(e => console.warn('Auto-play bloqueado:', e));
          setIsLoading(false);
          onVideoReady?.();
        };
        return;
      }
    }

    // Para espectadores ou fallback: tentar protocolos
    const protocols = [
      { name: 'HLS', fn: () => tryHLS(videoEl, videoUrl) },
      { name: 'WebRTC', fn: () => tryWebRTC(videoEl, videoUrl) },
      { name: 'FLV', fn: () => tryFLV(videoEl, videoUrl) },
      { name: 'Fallback', fn: () => tryFallback(videoEl) }
    ];

    for (const { name, fn } of protocols) {
      try {
        console.log(`PD Player - Tentando protocolo: ${name}`);
        
        const success = await fn();
        if (success) {
          console.log(`PD Player - Sucesso com: ${name}`);
          setIsLoading(false);
          onVideoReady?.();
          return;
        }
      } catch (error) {
        console.warn(`${name} falhou:`, error);
        continue;
      }
    }

    throw new Error('Nenhum protocolo funcionou');
  };

  // Funções de protocolo corrigidas
  const tryHLS = async (videoEl: HTMLVideoElement, url: string): Promise<boolean> => {
    try {
      // Converter URL FLV para HLS se necessário
      let hlsUrl = url;
      if (url.includes('.flv')) {
        hlsUrl = url.replace('.flv', '.m3u8').replace('http://localhost:8080', 'https://72.60.249.175');
      }
      
      console.log('PD Player - HLS URL:', hlsUrl);
      videoEl.src = hlsUrl;
      videoEl.muted = false;
      
      await new Promise<void>((resolve, reject) => {
        videoEl.onloadeddata = () => {
          videoEl.play().catch(e => console.warn('Auto-play bloqueado:', e));
          resolve();
        };
        
        videoEl.onerror = (e) => {
          console.error('HLS error:', e);
          reject(new Error('Erro no elemento HLS'));
        };
        
        setTimeout(() => reject(new Error('Timeout HLS')), 10000);
      });
      
      return true;
    } catch (error) {
      console.warn('HLS falhou:', error);
      return false;
    }
  };

  const tryWebRTC = async (videoEl: HTMLVideoElement, url: string): Promise<boolean> => {
    try {
      // Converter URL FLV para WebRTC se necessário
      let webrtcUrl = url;
      if (url.includes('.flv')) {
        webrtcUrl = url.replace('.flv', '').replace('http://localhost:8080/live/live', 'webrtc://72.60.249.175/live');
      }
      
      console.log('PD Player - WebRTC URL:', webrtcUrl);
      const remoteStream = await webRTCService.startPlay(webrtcUrl);
      
      if (remoteStream) {
        videoEl.srcObject = remoteStream;
        videoEl.muted = false;
        videoEl.volume = 1.0;
        
        videoEl.onloadeddata = () => {
          videoEl.play().catch(e => console.warn('Auto-play bloqueado:', e));
        };
        
        return true;
      }
    } catch (error) {
      console.warn('WebRTC falhou:', error);
      return false;
    }
  };

  const tryFLV = async (videoEl: HTMLVideoElement, url: string): Promise<boolean> => {
    // FLV não suportado diretamente em HTML5
    console.warn('FLV não suportado diretamente, tentando conversão HLS');
    return false;
  };

  const tryFallback = async (videoEl: HTMLVideoElement): Promise<boolean> => {
    // Para host: tentar getUserMedia direto
    if (currentUser.id === streamer.hostId) {
      try {
        console.log('PD Player - Tentando getUserMedia direto');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        videoEl.srcObject = stream;
        videoEl.muted = true;
        
        videoEl.onloadeddata = () => {
          videoEl.play().catch(e => console.warn('Auto-play bloqueado:', e));
        };
        
        return true;
      } catch (error) {
        console.warn('getUserMedia falhou:', error);
      }
    }
    
    // Placeholder final - sem poster para não mostrar capa
    console.log('PD Player - Usando fallback sem vídeo');
    setIsLoading(false);
    onVideoReady?.();
    return true;
  };

  // Cleanup
  useEffect(() => {
    return () => {
      const videoEl = videoRef.current;
      if (videoEl && videoEl.srcObject) {
        const stream = videoEl.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-black">
      {/* Loading - mínimo e discreto */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white opacity-50"></div>
        </div>
      )}

      {/* Elemento de vídeo - apenas o vídeo, sem poster */}
      <video
        ref={videoRef}
        className={className}
        playsInline
        muted={currentUser.id === streamer.hostId}
        autoPlay={true}
        controls={false} // Sem controles visíveis
        key={`pd-player-${streamer.id}`}
        // Sem poster para não mostrar capa
      />
    </div>
  );
};

export default PDVideoPlayer;
