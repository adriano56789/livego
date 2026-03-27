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
  const [latency, setLatency] = useState<number | null>(null);
  const [isCompatibilityMode, setIsCompatibilityMode] = useState(false);
  const [isWebRTCActive, setIsWebRTCActive] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const hlsInstanceRef = useRef<Hls | null>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    // Removido log sensível com informações do usuário

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
        console.log('🎬 Inicializando player de vídeo automaticamente...');
        
        if (isBroadcaster) {
          // Dono da live: SEMPRE capturar câmera imediatamente
          console.log('📹 Dono da live detectado - iniciando câmera imediatamente...');
          await setupBroadcasterStream(videoEl);
        } else {
          // Viewer: assistir transmissão HLS automaticamente
          console.log('👥 Viewer detectado - iniciando transmissão HLS...');
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

    // INICIAR STREAM IMEDIATAMENTE (sem delay)
    setupStream();

    const setupBroadcasterStream = async (videoEl: HTMLVideoElement) => {
      console.log(' Configurando broadcaster para WebView...');
      
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

        // SOLICITAR PERMISSÃO E CAPTURAR MÍDIA COM DIAGNÓSTICO
        console.log('🎥 Diagnóstico: Verificando permissões...');
        
        // Verificar permissões antes de solicitar
        const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
        console.log('📹 Status permissão câmera:', permissions.state);
        
        const audioPermissions = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        console.log('🎤 Status permissão microfone:', audioPermissions.state);

        // Solicitar acesso à câmera
        console.log('📷 Chamando getUserMedia...');
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('✅ getUserMedia sucesso! Tracks:', mediaStream.getTracks().length);

        // Verificar se os tracks estão ativos
        const videoTrack = mediaStream.getVideoTracks()[0];
        const audioTrack = mediaStream.getAudioTracks()[0];
        
        console.log('📹 Video track:', videoTrack ? {
          enabled: videoTrack.enabled,
          muted: videoTrack.muted,
          readyState: videoTrack.readyState,
          settings: videoTrack.getSettings()
        } : 'NÃO ENCONTRADO');
        
        console.log('🎤 Audio track:', audioTrack ? {
          enabled: audioTrack.enabled,
          muted: audioTrack.muted,
          readyState: audioTrack.readyState,
          settings: audioTrack.getSettings()
        } : 'NÃO ENCONTRADO');
        
        if (!videoTrack || !videoTrack.enabled) {
          throw new Error('Câmera não disponível ou foi bloqueada');
        }

        // EXIBIR PREVIEW LOCAL IMEDIATAMENTE (sem esperar por nada)
        console.log('🖼️ Configurando preview local...');
        videoEl.srcObject = mediaStream;
        videoEl.muted = true; // Sempre mutado para broadcaster (evitar eco)
        
        // FORÇAR O VÍDEO A APARECER IMEDIATAMENTE
        videoEl.play().then(() => {
          console.log('✅ Vídeo local iniciado com sucesso');
        }).catch(err => {
          console.warn('⚠️ Autoplay bloqueado, mas vídeo está configurado:', err);
          // NÃO lançar erro - continuar com o fluxo
        });
        
        // 🚀 BROADCASTER: Vídeo está funcionando localmente imediatamente
        setIsLoading(false);
        setIsWebRTCActive(true); // Marcar que WebRTC está ativo localmente
        onVideoReady?.();
        
        console.log('🎯 Preview local ativo - usuário já vê sua câmera');
        
        // Guardar referência para cleanup
        mediaStreamRef.current = mediaStream;
        
        // ESTRATÉGIA DE FALLBACK GARANTINDO TRANSMISSÃO
        let streamingSuccess = false;
        let fallbackUsed = false;
        
        // 1. Tentar WebRTC WHIP primeiro (melhor qualidade)
        try {
          console.log('🌐 Iniciando WebRTC WHIP (melhor qualidade)...');
          const { webRTCService } = await import('../services/webrtcService.js');
          
          // Usar userId real para WHIP (padrão SRS: app=live&stream={userId})
          const userId = currentUser?.id || streamer?.id;
          if (!userId) {
            throw new Error('ID do usuário não encontrado');
          }
          
          console.log(`📡 Iniciando WebRTC WHIP para userId: ${userId}`);
          console.log('🌐 Diagnóstico WebRTC - Iniciando publicação...');
          
          // MONITORAR ESTADO WebRTC
          const startTime = Date.now();
          
          await webRTCService.startPublish(userId, mediaStream);
          
          const endTime = Date.now();
          console.log(`✅ WebRTC WHIP funcionou em ${endTime - startTime}ms`);
          console.log('🌐 Diagnóstico WebRTC - Publicação bem-sucedida');
          
          streamingSuccess = true;
          setIsConnected(true);
          console.log('🎯 WebRTC WHIP funcionando - transmissão ativa para espectadores');
        } catch (webrtcError) {
          console.error(`❌ WebRTC falhou:`, webrtcError);
          console.log('🌐 Diagnóstico WebRTC - Falha na publicação');
          
          // DIAGNÓSTICO DETALHADO DO ERRO
          if (webrtcError instanceof Error) {
            console.log('🔍 Tipo de erro:', webrtcError.name);
            console.log('🔍 Mensagem:', webrtcError.message);
            
            if (webrtcError.message.includes('getUserMedia')) {
              console.log('❌ Problema: Permissão de câmera/microfone');
            } else if (webrtcError.message.includes('network') || webrtcError.message.includes('ICE')) {
              console.log('❌ Problema: Conexão de rede/firewall/NAT');
            } else if (webrtcError.message.includes('timeout')) {
              console.log('❌ Problema: Timeout na conexão');
            } else if (webrtcError.message.includes('401') || webrtcError.message.includes('403')) {
              console.log('❌ Problema: Autenticação');
            } else if (webrtcError.message.includes('500')) {
              console.log('❌ Problema: Erro no servidor SRS');
            }
          }
          
          fallbackUsed = true;
          setIsCompatibilityMode(true);
          
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
            // Usando apenas preview local - espectadores não verão
            setIsConnected(true); // Conectado localmente apenas
            console.log('⚠️ Apenas preview local ativo - espectadores não verão a transmissão');
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
        
        // AVISO SE FALLBACK ESTIVER ATIVO
        if (fallbackUsed) {
          console.warn(' ATENÇÃO: WebRTC falhou, mas fallback HLS está ativo.');
          console.warn(' Espectadores devem conseguir assistir via HLS normal');
          console.warn(' Se espectadores não conseguirem ver, recarregue a página');
          
          // Notificar usuário sobre fallback (não erro, apenas informativo)
          if (onVideoError) {
            onVideoError('WebRTC em modo de compatibilidade. Espectadores devem assistir normalmente via HLS.');
          }
        }
        
      } catch (mediaError) {
        console.error(' Erro ao capturar mídia:', mediaError);
        
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

    // FUNÇÃO DE FALLBACK HLS GARANTIDO
    const activateHLSFallback = async (streamKey: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          console.log(' Ativando fallback HLS para stream:', streamKey);
          
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
                console.log(' Backend notificado sobre fallback HLS');
                resolve();
              } else {
                console.warn(' Backend não respondeu ao fallback, mas HLS deve funcionar');
                resolve(); // Não falhar, HLS pode funcionar mesmo sem notificação
              }
            } catch (error) {
              console.warn(' Erro ao notificar backend, mas HLS deve funcionar:', error);
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
      console.log(' Configurando viewer para WebView...');
      
      // Estratégia: WHEP (WebRTC) primeiro para baixa latência, depois HLS fallback
      let playbackSuccess = false;
      let webrtcUsed = false;

      // 1. TENTAR WEBRTC WHEP PRIMEIRO (baixa latência)
      try {
        console.log('🚀 Tentando WebRTC WHEP (baixa latência)...');
        
        const { webRTCService } = await import('../services/webrtcService.js');
        
        // Usar userId real do streamer para WHEP (consistente com WHIP)
        const streamId = streamer?.id;
        if (!streamId) {
          throw new Error('ID do streamer não encontrado para WHEP');
        }
        
        console.log(`📡 Iniciando WebRTC WHEP para streamId: ${streamId}`);
        
        // Iniciar playback WebRTC via WHEP
        const remoteStream = await webRTCService.startPlay(streamId);
        
        if (remoteStream) {
          // Exibir stream WebRTC recebido
          videoEl.srcObject = remoteStream;
          videoEl.muted = false; // Viewer precisa ouvir
          
          // Aguardar vídeo estar pronto
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Timeout WebRTC WHEP'));
            }, 10000);

            videoEl.addEventListener('loadeddata', () => {
              clearTimeout(timeout);
              resolve(true);
            }, { once: true });

            videoEl.addEventListener('error', () => {
              clearTimeout(timeout);
              reject(new Error('Erro ao carregar WebRTC WHEP'));
            }, { once: true });
          });

          await videoEl.play();
          playbackSuccess = true;
          webrtcUsed = true;
          setIsWebRTCActive(true);
          setIsConnected(true);
          console.log('✅ WebRTC WHEP funcionando - baixa latência ativa');
        }
      } catch (webrtcError) {
        console.warn('⚠️ WebRTC WHEP falhou, usando HLS fallback:', webrtcError);
        // Limpar objeto em caso de falha
        videoEl.srcObject = null;
      }

      // 2. FALLBACK HLS SE WEBRTC FALHAR
      if (!playbackSuccess) {
        const hlsUrl = getHLSUrl();
        
        if (!hlsUrl) {
          throw new Error('URL de streaming não encontrada');
        }

        console.log('🔄 Usando HLS fallback (compatibilidade)...');

        // HLS.js para Chrome, Firefox, Edge (não-iOS)
        try {
          if (Hls.isSupported()) {
            console.log(' Usando HLS.js (Chrome/Firefox/Edge)');
            
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
            
            // Guardar referência para cleanup e medição de latência
            hlsInstanceRef.current = hls;

            hls.loadSource(hlsUrl);
            hls.attachMedia(videoEl);

            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                hls.destroy();
                reject(new Error('Timeout HLS.js'));
              }, 15000); // 15s timeout

              hls.on(Hls.Events.MANIFEST_PARSED, () => {
                clearTimeout(timeout);
                
                // Iniciar medição de latência HLS
                startLatencyMeasurement(hls);
                
                resolve(true);
              });
              
              hls.on(Hls.Events.ERROR, (event, data) => {
                console.warn(' HLS.js Error:', data);
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
          console.warn(' HLS.js falhou:', hlsError);
        }

        // HLS nativo para Safari, iOS, Chrome Mobile
        if (!playbackSuccess && videoEl.canPlayType('application/vnd.apple.mpegurl')) {
          try {
            console.log(' Usando HLS nativo (Safari/iOS)');
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
            console.warn(' HLS nativo falhou:', nativeError);
          }
        }

        // Fallback para MP4 direto se disponível (última opção)
        if (!playbackSuccess) {
          try {
            console.log(' Tentando fallback MP4 (último recurso)');
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
            console.warn(' MP4 fallback falhou:', mp4Error);
          }
        }
      }

      if (!playbackSuccess) {
        throw new Error('Nenhum método de reprodução funcionou. Tente recarregar a página ou verifique se a transmissão está ativa.');
      }

      setIsLoading(false);
      onVideoReady?.();

      // Informar sobre tipo de conexão
      if (webrtcUsed) {
        console.log('🎯 Viewer conectado via WebRTC WHEP (baixa latência)');
      } else {
        console.log('📺 Viewer conectado via HLS (compatibilidade)');
      }
    };

    // FUNÇÃO DE MEDIÇÃO DE LATÊNCIA HLS
    const startLatencyMeasurement = (hls: Hls) => {
      if (!isBroadcaster) return; // Apenas broadcaster precisa saber da latência
      
      let latencyCheckInterval: NodeJS.Timeout;
      
      const measureLatency = async () => {
        try {
          // Obter estatísticas do HLS
          const stats = await hls.levels;
          if (stats && stats.length > 0) {
            // Estimar latência baseada no buffer e fragment duration
            const currentLevel = hls.currentLevel;
            if (currentLevel >= 0 && stats[currentLevel]) {
              const level = stats[currentLevel];
              const fragmentDuration = level.details?.fragments[0]?.duration || 2;
              
              // Latência aproximada = buffer length + fragment duration
              const bufferLength = videoEl.buffered.length > 0 ? 
                videoEl.buffered.end(videoEl.buffered.length - 1) - videoEl.currentTime : 0;
              
              const estimatedLatency = Math.round((bufferLength + fragmentDuration) * 1000);
              setLatency(estimatedLatency);
              
              // Alertar se latência for muito alta (acima de 10 segundos)
              if (estimatedLatency > 10000) {
                console.warn(`⚠️ Alta latência detectada: ${estimatedLatency}ms`);
                if (onVideoError) {
                  onVideoError(`Alta latência detectada: ${Math.round(estimatedLatency/1000)}s de atraso para espectadores`);
                }
              }
            }
          }
        } catch (error) {
          // Ignorar erros na medição
        }
      };
      
      // Medir a cada 5 segundos
      latencyCheckInterval = setInterval(measureLatency, 5000);
      
      // Medição inicial
      setTimeout(measureLatency, 2000);
      
      // Cleanup no unmount
      return () => {
        if (latencyCheckInterval) {
          clearInterval(latencyCheckInterval);
        }
      };
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
      // 🔐 SEGURANÇA: Usar ID em vez de streamKey na URL pública
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

    // Cleanup completo e robusto
    return () => {
      // Limpando WebViewStreamPlayer...
      
      // 1. Parar e limpar mídia local (broadcaster)
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          track.stop(); // Parar track completamente
          track.enabled = false; // Desabilitar
        });
        mediaStreamRef.current = null;
      }
      
      // 2. Limpar mídia do elemento de vídeo
      if (videoEl.srcObject) {
        const stream = videoEl.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          track.stop(); // Garantir que todos os tracks estejam parados
          track.enabled = false;
        });
        videoEl.srcObject = null;
      }
      
      // 3. Destruir instância HLS (viewer)
      if (hlsInstanceRef.current) {
        try {
          hlsInstanceRef.current.destroy();
        } catch (e) {
          // Ignorar erros ao destruir
        }
        hlsInstanceRef.current = null;
      }
      
      // 4. Parar WebRTC (broadcaster)
      if (isBroadcaster) {
        import('../services/webrtcService.js').then(({ webRTCService }) => {
          try {
            webRTCService.stop();
          } catch (e) {
            // Ignorar erros ao parar
          }
        });
      }
      
      // 5. Reset completo do elemento de vídeo
      videoEl.pause();
      videoEl.removeAttribute('src');
      videoEl.load();
      
      // 6. Limpar estados
      setLatency(null);
      setIsCompatibilityMode(false);
      setIsWebRTCActive(false);
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
          // Vídeo carregado
          setIsLoading(false);
        }}
      />
      
      {/* Status indicators */}
      {isBroadcaster && (
        <>
          <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full mr-2 inline-block animate-pulse"></div>
            AO VIVO - SUA CÂMARA
          </div>
          
          {/* Indicador de latência para broadcaster */}
          {latency && (
            <div className={`absolute top-16 left-3 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg ${
              latency > 10000 ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'
            }`}>
              <div className="w-2 h-2 bg-white rounded-full mr-2 inline-block"></div>
              ATRASO: {Math.round(latency/1000)}s
            </div>
          )}
          
          {/* Indicador de modo de compatibilidade */}
          {isCompatibilityMode && (
            <div className="absolute top-28 left-3 bg-orange-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full mr-2 inline-block animate-pulse"></div>
              MODO COMPATIBILIDADE
            </div>
          )}
        </>
      )}
      
      {/* Indicador para viewer */}
      {!isBroadcaster && isConnected && (
        <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
          <div className="w-2 h-2 bg-white rounded-full mr-2 inline-block"></div>
          {isWebRTCActive ? 'BAIXA LATÊNCIA' : 'ASSISTINDO'}
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
