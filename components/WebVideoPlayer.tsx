import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';

interface WebVideoPlayerProps {
  streamer: any;
  currentUser: any;
  isBroadcaster: boolean;
  streamUrl?: string;
  onVideoReady?: () => void;
  onVideoError?: (error: string) => void;
  className?: string;
}

/**
 * Player de vídeo para Web App (WebView)
 * Usa HTML5 video + HLS.js para streaming
 * Funciona tanto para broadcasting (WebRTC) quanto para viewing (HLS)
 */
const WebVideoPlayer: React.FC<WebVideoPlayerProps> = ({
  streamer,
  currentUser,
  isBroadcaster,
  streamUrl,
  onVideoReady,
  onVideoError,
  className = "absolute inset-0 w-full h-full object-cover z-0"
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    console.log(`🎥 WebVideoPlayer: Usuário=${currentUser?.id} | Broadcaster=${isBroadcaster} | Stream=${streamer.id}`);

    setIsLoading(true);
    setIsVideoPlaying(false);
    setError(null);

    // Reset do elemento de vídeo
    videoEl.pause();
    videoEl.srcObject = null;
    videoEl.removeAttribute('src');
    videoEl.load();

    const setupVideo = async () => {
      try {
        if (isBroadcaster) {
          // BROADCASTER - Usar WebRTC para captura e envio
          await setupBroadcaster(videoEl);
        } else {
          // VIEWER - Usar HLS para reprodução
          await setupViewer(videoEl);
        }
      } catch (err) {
        console.error('❌ WebVideoPlayer Error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Erro ao configurar vídeo';
        setError(errorMessage);
        onVideoError?.(errorMessage);
        setIsLoading(false);
      }
    };

    const setupBroadcaster = async (videoEl: HTMLVideoElement) => {
      console.log('📹 Configurando broadcaster...');
      
      // Importar dinamicamente para evitar problemas no WebView
      const { webRTCService } = await import('../services/webrtcService.js');
      
      // Obter URL WebRTC do stream
      const webrtcUrl = getWebRTCUrl();
      console.log('🔗 WebRTC URL:', webrtcUrl);
      
      // Iniciar captura de câmera e envio via WebRTC
      const mediaStream = await webRTCService.startPublish(webrtcUrl, streamer.streamKey || streamer.id);
      
      // Exibir preview local
      videoEl.srcObject = mediaStream;
      await videoEl.play();
      
      setIsVideoPlaying(true);
      setIsLoading(false);
      onVideoReady?.();
      
      console.log('✅ Broadcaster configurado com sucesso');
    };

    const setupViewer = async (videoEl: HTMLVideoElement) => {
      console.log('👀 Configurando viewer...');
      
      // Obter URL HLS do stream
      const hlsUrl = getHLSUrl();
      console.log('🔗 HLS URL:', hlsUrl);
      
      if (!hlsUrl) {
        throw new Error('URL HLS não encontrada');
      }

      // Configurar HLS.js
      if (Hls.isSupported()) {
        console.log('📺 Usando HLS.js');
        
        // Destruir instância anterior se existir
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
        
        const hls = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          startLevel: -1,
          autoStartLoad: true,
          fragLoadingTimeOut: 20000,
          fragLoadingMaxRetry: 6,
          fragLoadingRetryDelay: 1000,
          manifestLoadingTimeOut: 10000,
          manifestLoadingMaxRetry: 6,
          manifestLoadingRetryDelay: 1000,
        });

        hlsRef.current = hls;

        hls.loadSource(hlsUrl);
        hls.attachMedia(videoEl);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('✅ Manifest HLS carregado');
          videoEl.play().catch(err => {
            console.warn('⚠️ Auto-play bloqueado, tentando com muted:', err);
            videoEl.muted = true;
            videoEl.play().then(() => {
              console.log('✅ Vídeo iniciado com muted');
              // Tentar habilitar áudio após interação do usuário
              videoEl.muted = false;
            }).catch(mutedErr => {
              console.warn('⚠️ Não foi possível iniciar vídeo mesmo com muted:', mutedErr);
            });
          });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('❌ HLS Error:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('🔄 Tentando recuperar de erro de rede...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('🔄 Tentando recuperar de erro de mídia...');
                hls.recoverMediaError();
                break;
              default:
                console.error('❌ Erro fatal no HLS:', data);
                setError(`Erro no streaming: ${data.details}`);
                onVideoError?.(`Erro no streaming: ${data.details}`);
                setIsLoading(false);
                break;
            }
          }
        });

      } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari nativo
        console.log('📺 Usando HLS nativo (Safari)');
        videoEl.src = hlsUrl;
        videoEl.play();
      } else {
        throw new Error('HLS não suportado neste navegador/WebView');
      }

      setIsVideoPlaying(true);
      setIsLoading(false);
      onVideoReady?.();
      
      console.log('✅ Viewer configurado com sucesso');
    };

    const getWebRTCUrl = (): string => {
      // Prioridades: streamUrl > streamer.playbackUrl > construção automática
      if (streamUrl) {
        return streamUrl;
      }
      
      if (streamer.playbackUrl && streamer.playbackUrl.includes('wss://')) {
        return streamer.playbackUrl;
      }
      
      // Construir URL baseada no ambiente
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isLocal ? 'wss://localhost:8000/live' : 'wss://livego.store:8000/live';
      return `${baseUrl}/${streamer.id}`;
    };

    const getHLSUrl = (): string => {
      // Prioridades: streamUrl > streamer.playbackUrl > construção automática
      if (streamUrl && streamUrl.includes('.m3u8')) {
        return streamUrl;
      }
      
      if (streamer.playbackUrl && streamer.playbackUrl.includes('.m3u8')) {
        return streamer.playbackUrl;
      }
      
      // Construir URL HLS baseada no ambiente
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isLocal ? 'http://localhost:8000/live' : 'https://livego.store:8000/live';
      return `${baseUrl}/${streamer.id}.m3u8`;
    };

    setupVideo();

    // Cleanup
    return () => {
      console.log('🧹 Limpando WebVideoPlayer...');
      
      // Limpar HLS
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      
      // Limpar WebRTC
      if (isBroadcaster) {
        import('../services/webrtcService.js').then(({ webRTCService }) => {
          webRTCService.stop();
        });
      }
      
      // Reset vídeo
      if (videoEl) {
        videoEl.pause();
        videoEl.srcObject = null;
        videoEl.removeAttribute('src');
        videoEl.load();
      }
    };
  }, [streamer, currentUser, isBroadcaster, streamUrl, onVideoReady, onVideoError]);

  // Loading indicator
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-black ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-sm">
            {isBroadcaster ? 'Iniciando câmera...' : 'Carregando transmissão...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex items-center justify-center bg-black ${className}`}>
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-white text-sm mb-2">Erro no streaming</p>
          <p className="text-gray-400 text-xs">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted={isBroadcaster} // Muted para broadcaster para evitar feedback
        autoPlay
        controls={!isBroadcaster} // Controls apenas para viewers
        onError={(e) => {
          console.error('❌ Video element error:', e);
          setError('Erro ao reproduzir vídeo');
          onVideoError?.('Erro ao reproduzir vídeo');
        }}
        onPlay={() => setIsVideoPlaying(true)}
        onPause={() => setIsVideoPlaying(false)}
        onLoadedMetadata={() => {
          console.log('✅ Metadados do vídeo carregados');
          setIsLoading(false);
        }}
      />
      
      {/* Indicator de status para broadcaster */}
      {isBroadcaster && (
        <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
          AO VIVO
        </div>
      )}
      
      {/* Indicator de conexão para viewer */}
      {!isBroadcaster && isVideoPlaying && (
        <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
          <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
          CONECTADO
        </div>
      )}
    </div>
  );
};

export default WebVideoPlayer;
