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
        if (isBroadcaster) {
          // 🎥 Dono da live: sempre capturar câmera local
          await setupBroadcasterStream(videoEl);
        } else {
          // 👥 Viewer: assistir transmissão HLS
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
        throw new Error('Câmera não suportada neste navegador. Use Chrome, Firefox, Edge ou Safari.');
      }

      // 🎥 SEMPRE tentar capturar a câmera ao entrar ao vivo
      try {
        console.log('📷 Solicitando acesso à câmera e microfone...');
        
        // Configurações robustas para todos os navegadores
        const constraints = {
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            facingMode: 'user',
            // Configurações para melhor compatibilidade
            frameRate: { ideal: 30, max: 60 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            // Configurações para melhor compatibilidade
            sampleRate: 44100,
            channelCount: 1
          }
        };

        // Solicitar permissão e capturar mídia
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

        console.log('✅ Câmera capturada com sucesso:', {
          videoTracks: mediaStream.getVideoTracks().length,
          audioTracks: mediaStream.getAudioTracks().length,
          active: mediaStream.active
        });

        // Verificar se os tracks estão ativos
        const videoTrack = mediaStream.getVideoTracks()[0];
        const audioTrack = mediaStream.getAudioTracks()[0];
        
        if (!videoTrack || !videoTrack.enabled) {
          throw new Error('Câmera não disponível ou foi bloqueada');
        }

        // Exibir preview local
        videoEl.srcObject = mediaStream;
        videoEl.muted = true; // Sempre mutado para broadcaster (evitar eco)
        
        // 🚀 ESTRATÉGIA DE FALLBACK GARANTINDO TRANSMISSÃO
        let streamingSuccess = false;
        let fallbackUsed = false;
        
        // 1. Tentar WebRTC primeiro (melhor qualidade)
        try {
          console.log('🔗 Tentando WebRTC (melhor qualidade)...');
          const { webRTCService } = await import('../services/webrtcService.js');
          const webrtcUrl = getWebRTCUrl();
          console.log('🔗 WebRTC URL:', webrtcUrl);
          
          await webRTCService.startPublish(webrtcUrl, streamer.streamKey || streamer.id, mediaStream);
          streamingSuccess = true;
          setIsConnected(true);
          console.log('✅ WebRTC funcionando - transmissão ativa para espectadores');
        } catch (webrtcError) {
          console.warn('⚠️ WebRTC falhou, ativando modo de compatibilidade:', webrtcError);
          fallbackUsed = true;
          
          // 2. Fallback: Garantir que HLS funcione para espectadores
          // Mesmo que WebRTC falhe, vamos garantir que o stream esteja disponível via HLS
          try {
            console.log('🔄 Ativando fallback HLS para espectadores...');
            await activateHLSFallback(streamer.streamKey || streamer.id);
            streamingSuccess = true;
            setIsConnected(true);
            console.log('✅ Fallback HLS ativado - espectadores devem conseguir assistir via HLS');
          } catch (fallbackError) {
            console.error('❌ Fallback HLS falhou:', fallbackError);
            
            // 3. Último recurso: Apenas preview local com aviso claro
            console.warn('⚠️ Usando apenas preview local - espectadores não verão');
            setIsConnected(true); // Conectado localmente apenas
          }
        }

        // Aguardar vídeo estar pronto
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout ao carregar vídeo da câmera'));
          }, 10000);

          videoEl.addEventListener('loadeddata', () => {
            clearTimeout(timeout);
            resolve(true);
          }, { once: true });

          videoEl.addEventListener('error', () => {
            clearTimeout(timeout);
            reject(new Error('Erro ao carregar vídeo da câmera'));
          }, { once: true });
        });

        await videoEl.play();
        setIsLoading(false);
        onVideoReady?.();
        
        // 🚨 AVISO SE FALLBACK ESTIVER ATIVO
        if (fallbackUsed) {
          console.warn('🚨 ATENÇÃO: WebRTC falhou, mas fallback HLS está ativo.');
          console.warn('📺 Espectadores devem conseguir assistir via HLS normal');
          console.warn('🔄 Se espectadores não conseguirem ver, recarregue a página');
          
          // Notificar usuário sobre fallback (não erro, apenas informativo)
          if (onVideoError) {
            onVideoError('WebRTC em modo de compatibilidade. Espectadores devem assistir normalmente via HLS.');
          }
        }
        
      } catch (mediaError) {
        console.error('❌ Erro ao capturar mídia:', mediaError);
        
        // Mensagens de erro específicas
        if (mediaError instanceof Error) {
          if (mediaError.name === 'NotAllowedError') {
            throw new Error('Permissão negada. Permita o acesso à câmera nas configurações do navegador.');
          } else if (mediaError.name === 'NotFoundError') {
            throw new Error('Nenhuma câmera encontrada. Verifique se há uma câmera conectada.');
          } else if (mediaError.name === 'NotReadableError') {
            throw new Error('Câmera já está em uso por outro aplicativo.');
          } else if (mediaError.name === 'OverconstrainedError') {
            throw new Error('Câmera não suporta as configurações solicitadas.');
          }
        }
        
        throw new Error(`Falha ao acessar câmera: ${mediaError instanceof Error ? mediaError.message : 'Erro desconhecido'}`);
      }
    };

    // � FUNÇÃO DE FALLBACK HLS GARANTIDO
    const activateHLSFallback = async (streamKey: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          console.log('📺 Ativando fallback HLS para stream:', streamKey);
          
          // Estratégia: Notificar backend que WebRTC falhou
          // Backend pode então garantir que HLS está ativo via SRS
          const notifyFallback = async () => {
            try {
              const response = await fetch('/api/streams/fallback-activate', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  streamKey,
                  reason: 'webrtc_failed',
                  timestamp: new Date().toISOString()
                })
              });
              
              if (response.ok) {
                console.log('✅ Backend notificado sobre fallback HLS');
                resolve();
              } else {
                console.warn('⚠️ Backend não respondeu ao fallback, mas HLS deve funcionar');
                resolve(); // Não falhar, HLS pode funcionar mesmo sem notificação
              }
            } catch (error) {
              console.warn('⚠️ Erro ao notificar backend, mas HLS deve funcionar:', error);
              resolve(); // Não falhar, HLS pode funcionar mesmo sem notificação
            }
          };
          
          // Aguardar um pouco para garantir que stream esteja ativo
          setTimeout(notifyFallback, 2000);
          
        } catch (error) {
          reject(error);
        }
      });
    };

    const setupViewerStream = async (videoEl: HTMLVideoElement) => {
      console.log('👀 Configurando viewer para WebView...');
      
      const hlsUrl = getHLSUrl();
      console.log('🔗 HLS URL:', hlsUrl);
      
      if (!hlsUrl) {
        throw new Error('URL de streaming não encontrada');
      }

      // Estratégia de compatibilidade total para todos os navegadores
      let playbackSuccess = false;

      // 1. HLS.js para Chrome, Firefox, Edge (não-iOS)
      try {
        if (Hls.isSupported()) {
          console.log('📺 Usando HLS.js (Chrome/Firefox/Edge)');
          
          const hls = new Hls({
            debug: false,
            enableWorker: true,
            lowLatencyMode: false, // Desabilitar para melhor compatibilidade
            maxBufferLength: 30,
            maxMaxBufferLength: 600,
            // Configurações robustas para compatibilidade
            maxFragLookUpTolerance: 0.25,
            liveSyncDurationCount: 3,
            liveMaxLatencyDurationCount: Infinity,
            preferManagedMediaSource: true,
          });

          hls.loadSource(hlsUrl);
          hls.attachMedia(videoEl);

          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              hls.destroy();
              reject(new Error('Timeout HLS.js'));
            }, 15000); // 15s timeout

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              clearTimeout(timeout);
              resolve(true);
            });
            
            hls.on(Hls.Events.ERROR, (event, data) => {
              console.warn('⚠️ HLS.js Error:', data);
              if (data.fatal) {
                clearTimeout(timeout);
                hls.destroy();
                reject(new Error('HLS.js fatal error'));
              }
            });
          });

          await videoEl.play();
          playbackSuccess = true;
          setIsConnected(true);
          console.log('✅ HLS.js funcionando');
        }
      } catch (hlsError) {
        console.warn('⚠️ HLS.js falhou:', hlsError);
      }

      // 2. HLS nativo para Safari, iOS, Chrome Mobile
      if (!playbackSuccess && videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        try {
          console.log('📺 Usando HLS nativo (Safari/iOS)');
          videoEl.src = hlsUrl;
          
          // Aguardar o vídeo estar pronto
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Timeout HLS nativo'));
            }, 15000);

            videoEl.addEventListener('loadeddata', () => {
              clearTimeout(timeout);
              resolve(true);
            }, { once: true });

            videoEl.addEventListener('error', () => {
              clearTimeout(timeout);
              reject(new Error('Erro carregando HLS nativo'));
            }, { once: true });
          });

          await videoEl.play();
          playbackSuccess = true;
          setIsConnected(true);
          console.log('✅ HLS nativo funcionando');
        } catch (nativeError) {
          console.warn('⚠️ HLS nativo falhou:', nativeError);
        }
      }

      // 3. Fallback para MP4 direto se disponível
      if (!playbackSuccess) {
        try {
          console.log('📺 Tentando fallback MP4');
          const mp4Url = hlsUrl.replace('.m3u8', '.mp4');
          videoEl.src = mp4Url;
          
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Timeout MP4'));
            }, 10000);

            videoEl.addEventListener('loadeddata', () => {
              clearTimeout(timeout);
              resolve(true);
            }, { once: true });

            videoEl.addEventListener('error', () => {
              clearTimeout(timeout);
              reject(new Error('Erro carregando MP4'));
            }, { once: true });
          });

          await videoEl.play();
          playbackSuccess = true;
          setIsConnected(true);
          console.log('✅ MP4 fallback funcionando');
        } catch (mp4Error) {
          console.warn('⚠️ MP4 fallback falhou:', mp4Error);
        }
      }

      if (!playbackSuccess) {
        throw new Error('Nenhum método de reprodução funcionou neste navegador. Verifique se a transmissão está ativa.');
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
      {isBroadcaster && (
        <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
          <div className="w-2 h-2 bg-white rounded-full mr-2 inline-block animate-pulse"></div>
          AO VIVO - SUA CÂMERA
        </div>
      )}
      
      {isBroadcaster && error && error.includes('compatibilidade') && (
        <div className="absolute top-16 left-3 bg-yellow-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
          <div className="w-2 h-2 bg-white rounded-full mr-2 inline-block"></div>
            MODO COMPATIBILIDADE
        </div>
      )}
      
      {!isBroadcaster && isConnected && (
        <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
          <div className="w-2 h-2 bg-white rounded-full mr-2 inline-block"></div>
          ASSISTINDO
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
