import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';

interface WebViewStreamPlayerProps {
  streamer: any;
  currentUser: any;
  isBroadcaster: boolean;
  streamUrl?: string;
  onVideoReady?: () => void;
  onVideoError?: (error: string) => void;
  className?: string;
}

/**
 * Player de vídeo otimizado para WebView (Android/iOS)
 * Implementação simplificada focada em compatibilidade máxima
 */
const WebViewStreamPlayer: React.FC<WebViewStreamPlayerProps> = ({
  streamer,
  currentUser,
  isBroadcaster,
  streamUrl,
  onVideoReady,
  onVideoError,
  className = "absolute inset-0 w-full h-full object-cover z-0"
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    console.log(`📱 WebViewStreamPlayer: Usuário=${currentUser?.id} | Broadcaster=${isBroadcaster}`);

    setIsLoading(true);
    setError(null);
    setIsConnected(false);

    // Reset do elemento de vídeo
    videoEl.pause();
    videoEl.srcObject = null;
    videoEl.removeAttribute('src');
    videoEl.load();

    const setupStream = async () => {
      try {
        // 🎥 LÓGICA CORRIGIDA: Dono assistindo de outro dispositivo
        // Se isBroadcaster=true mas recebeu streamUrl HLS, tratar como viewer
        if (isBroadcaster && streamUrl && streamUrl.includes('.m3u8')) {
          console.log('🎥 Dono da live assistindo de outro dispositivo - tratando como viewer');
          await setupViewerStream(videoEl);
        } else if (isBroadcaster) {
          // Caso normal: broadcaster no dispositivo de transmissão
          await setupBroadcasterStream(videoEl);
        } else {
          // Viewer normal
          await setupViewerStream(videoEl);
        }
      } catch (err) {
        console.error('❌ WebViewStreamPlayer Error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Erro no streaming';
        setError(errorMessage);
        onVideoError?.(errorMessage);
        setIsLoading(false);
      }
    };

    const setupBroadcasterStream = async (videoEl: HTMLVideoElement) => {
      console.log('📹 Configurando broadcaster para WebView...');
      
      // Verificar suporte a getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada neste WebView');
      }

      // 🎥 CORREÇÃO: Sempre tentar capturar a câmera ao entrar ao vivo
      try {
        console.log('📷 Solicitando acesso à câmera e microfone...');
        
        // Solicitar permissão e capturar mídia
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        console.log('✅ Câmera capturada com sucesso:', mediaStream.getVideoTracks().length, 'tracks');

        // Exibir preview local
        videoEl.srcObject = mediaStream;
        
        // Iniciar WebRTC para envio
        try {
          const { webRTCService } = await import('../services/webrtcService.js');
          const webrtcUrl = getWebRTCUrl();
          console.log('🔗 WebRTC URL:', webrtcUrl);
          
          // Passar o mediaStream para o WebRTC
          await webRTCService.startPublish(webrtcUrl, streamer.streamKey || streamer.id, mediaStream);
          setIsConnected(true);
          console.log('✅ WebRTC publishing iniciado com mediaStream');
        } catch (webrtcError) {
          console.warn('⚠️ WebRTC falhou, usando apenas preview local:', webrtcError);
          // Continuar com preview local mesmo sem WebRTC
        }

        await videoEl.play();
        setIsLoading(false);
        onVideoReady?.();
        
      } catch (mediaError) {
        console.error('❌ Erro ao capturar mídia:', mediaError);
        throw new Error(`Falha ao acessar câmera: ${mediaError instanceof Error ? mediaError.message : 'Erro desconhecido'}`);
      }
    };

    const setupViewerStream = async (videoEl: HTMLVideoElement) => {
      console.log('👀 Configurando viewer para WebView...');
      
      const hlsUrl = getHLSUrl();
      console.log('🔗 HLS URL:', hlsUrl);
      
      if (!hlsUrl) {
        throw new Error('URL de streaming não encontrada');
      }

      // Estratégia de fallback para WebView
      let playbackSuccess = false;

      // 1. Tentar HLS.js
      try {
        if (Hls.isSupported()) {
          console.log('📺 Usando HLS.js');
          
          const hls = new Hls({
            debug: false,
            enableWorker: true,
            lowLatencyMode: true,
            maxBufferLength: 30,
            maxMaxBufferLength: 600,
          });

          hls.loadSource(hlsUrl);
          hls.attachMedia(videoEl);

          await new Promise((resolve, reject) => {
            hls.on(Hls.Events.MANIFEST_PARSED, resolve);
            hls.on(Hls.Events.ERROR, reject);
            setTimeout(reject, 10000); // Timeout 10s
          });

          await videoEl.play();
          playbackSuccess = true;
          setIsConnected(true);
          console.log('✅ HLS.js funcionando');
        }
      } catch (hlsError) {
        console.warn('⚠️ HLS.js falhou:', hlsError);
      }

      // 2. Tentar HLS nativo (Safari/iOS)
      if (!playbackSuccess && videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        try {
          console.log('📺 Tentando HLS nativo');
          videoEl.src = hlsUrl;
          await videoEl.play();
          playbackSuccess = true;
          setIsConnected(true);
          console.log('✅ HLS nativo funcionando');
        } catch (nativeError) {
          console.warn('⚠️ HLS nativo falhou:', nativeError);
        }
      }

      // 3. Tentar streaming direto como fallback
      if (!playbackSuccess) {
        try {
          console.log('📺 Tentando streaming direto');
          const directUrl = getDirectStreamUrl();
          if (directUrl) {
            videoEl.src = directUrl;
            await videoEl.play();
            playbackSuccess = true;
            setIsConnected(true);
            console.log('✅ Streaming direto funcionando');
          }
        } catch (directError) {
          console.warn('⚠️ Streaming direto falhou:', directError);
        }
      }

      if (!playbackSuccess) {
        throw new Error('Nenhum método de reprodução funcionou neste WebView');
      }

      setIsLoading(false);
      onVideoReady?.();
    };

    const getWebRTCUrl = (): string => {
      if (streamUrl) return streamUrl;
      if (streamer.playbackUrl && streamer.playbackUrl.includes('webrtc://')) return streamer.playbackUrl;
      
      const isLocal = window.location.hostname === 'localhost';
      // SRS WebRTC usa porta 8000, não 8000/api
      const baseUrl = isLocal ? 'webrtc://localhost:8000/live' : 'webrtc://72.60.249.175:8000/live';
      return `${baseUrl}/${streamer.id}`;
    };

    const getHLSUrl = (): string => {
      if (streamUrl && streamUrl.includes('.m3u8')) return streamUrl;
      if (streamer.playbackUrl && streamer.playbackUrl.includes('.m3u8')) return streamer.playbackUrl;
      
      const isLocal = window.location.hostname === 'localhost';
      // HLS vem do servidor HTTP do SRS na porta 8080
      const baseUrl = isLocal ? 'http://localhost:8080/live' : 'http://72.60.249.175:8080/live';
      return `${baseUrl}/${streamer.id}.m3u8`;
    };

    const getDirectStreamUrl = (): string => {
      // Fallback para streaming direto (pode ser FLV, WebRTC direto, etc.)
      if (streamer.playbackUrl && !streamer.playbackUrl.includes('.m3u8')) {
        return streamer.playbackUrl;
      }
      return '';
    };

    setupStream();

    // Cleanup
    return () => {
      console.log('🧹 Limpando WebViewStreamPlayer...');
      
      // Parar tracks de mídia
      if (videoEl.srcObject) {
        const stream = videoEl.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Parar WebRTC
      if (isBroadcaster) {
        import('../services/webrtcService.js').then(({ webRTCService }) => {
          webRTCService.stop();
        });
      }
      
      // Reset vídeo
      videoEl.pause();
      videoEl.srcObject = null;
      videoEl.removeAttribute('src');
      videoEl.load();
    };
  }, [streamer, currentUser, isBroadcaster, onVideoReady, onVideoError]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-black ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3"></div>
          <p className="text-white text-xs">
            {isBroadcaster ? 'Iniciando câmera...' : 'Conectando...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex items-center justify-center bg-black ${className}`}>
        <div className="text-center px-4">
          <div className="text-red-500 text-3xl mb-3">⚠️</div>
          <p className="text-white text-sm mb-1">Erro no streaming</p>
          <p className="text-gray-400 text-xs">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 bg-purple-600 text-white px-4 py-2 rounded text-xs"
          >
            Tentar novamente
          </button>
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
        muted={isBroadcaster}
        autoPlay
        controls={!isBroadcaster}
        onError={(e) => {
          console.error('❌ Video error:', e);
          setError('Erro ao reproduzir vídeo');
          onVideoError?.('Erro ao reproduzir vídeo');
        }}
        onLoadedMetadata={() => {
          console.log('✅ Vídeo carregado');
          setIsLoading(false);
        }}
      />
      
      {/* Status indicators */}
      {isBroadcaster && !streamUrl?.includes('.m3u8') && (
        <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
          <div className="w-1.5 h-1.5 bg-white rounded-full mr-1 inline-block animate-pulse"></div>
          AO VIVO
        </div>
      )}
      
      {isBroadcaster && streamUrl?.includes('.m3u8') && (
        <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
          <div className="w-1.5 h-1.5 bg-white rounded-full mr-1 inline-block"></div>
          ASSISTINDO
        </div>
      )}
      
      {!isBroadcaster && isConnected && (
        <div className="absolute top-3 right-3 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
          <div className="w-1.5 h-1.5 bg-white rounded-full mr-1 inline-block"></div>
          ONLINE
        </div>
      )}
      
      {/* WebView compatibility info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-3 left-3 bg-black/50 text-white px-2 py-1 rounded text-xs">
          WebView Mode
        </div>
      )}
    </div>
  );
};

export default WebViewStreamPlayer;
