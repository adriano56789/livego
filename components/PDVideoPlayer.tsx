import React, { useEffect, useRef, useState } from 'react';
import { webRTCService } from '../services/webrtcService';
import { srsService } from '../services/srsService';
import { RealIDGenerator } from '../services/RealIDGenerator';

interface PDVideoPlayerProps {
  streamer: {
    id: string;
    hostId: string;
    playbackUrl?: string;
    displayName?: string;
    realUserId?: string;
    roomId?: string;
  };
  streamUrl?: string;
  className?: string;
  onVideoReady?: () => void;
  onVideoError?: (error: string) => void;
  currentUser: {
    id: string;
  };
}

/**
 * PD Player - Player Limpo para Sala de Transmissão
 * Apenas vídeo, sem interferências - estilo TikTok
 */
const PDVideoPlayer: React.FC<PDVideoPlayerProps> = ({
  streamer,
  streamUrl,
  className = '',
  onVideoReady,
  onVideoError,
  currentUser
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Gerar URLs usando sistema de IDs reais
  const generateRealStreamURLs = () => {
    // Verificar se é um stream real usando o sistema novo
    const isValidStream = RealIDGenerator.isValidStreamID(streamer.id);
    
    if (!isValidStream) {
      console.warn('PD Player - Stream ID inválido:', streamer.id);
      return null;
    }

    // Extrair informações do streamId
    const parsed = RealIDGenerator.parseStreamID(streamer.id);
    if (!parsed) {
      console.warn('PD Player - Não foi possível parsear stream ID:', streamer.id);
      return null;
    }

    // Gerar URLs reais
    const urls = RealIDGenerator.generateStreamURLs(streamer.id, streamer.displayName || 'Unknown');
    
    // Função para mascarar IDs em logs
    const maskId = (id: string) => {
      if (!id || typeof id !== 'string') return '***';
      return id.length > 4 ? id.substring(0, 2) + '*'.repeat(id.length - 4) + id.substring(id.length - 2) : '***';
    };
    
    console.log('PD Player - Sistema de IDs Reais:');
    console.log('  Stream ID:', maskId(streamer.id));
    console.log('  User ID:', maskId(parsed.userId));
    console.log('  Display Name:', streamer.displayName);
    console.log('  Room ID:', maskId(streamer.roomId));
    console.log('  URLs:', urls);
    
    return urls;
  };

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
    // Construir URL usando configurações SRS próprias
    let videoUrl = streamUrl;
    
    if (!videoUrl) {
      if (streamer.playbackUrl) {
        videoUrl = streamer.playbackUrl;
      } else {
        // Usar servidor SRS próprio
        videoUrl = srsService.getWebRTCPlayUrl(streamer.id);
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

    // Para espectadores ou fallback: tentar protocolos com configurações próprias
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

  // Funções de protocolo corrigidas para máxima compatibilidade - Servidores Próprios
  const tryHLS = async (videoEl: HTMLVideoElement, url: string): Promise<boolean> => {
    try {
      // Converter URL FLV para HLS se necessário
      let hlsUrl = url;
      if (url.includes('.flv')) {
        // Usar servidor SRS próprio
        hlsUrl = srsService.getHlsUrl(streamer.id);
      }
      
      console.log('PD Player - HLS URL:', hlsUrl);
      
      // Detectar suporte HLS nativo (Safari, iOS, Edge)
      const canPlayHLSNatively = videoEl.canPlayType('application/vnd.apple.mpegurl') || 
                               videoEl.canPlayType('application/x-mpegURL');
      
      if (canPlayHLSNatively) {
        console.log('PD Player - Usando HLS nativo');
        videoEl.src = hlsUrl;
        videoEl.muted = false;
        
        await new Promise<void>((resolve, reject) => {
          videoEl.onloadeddata = () => {
            videoEl.play().catch(e => console.warn('Auto-play bloqueado:', e));
            resolve();
          };
          
          videoEl.onerror = (e) => {
            console.error('HLS nativo error:', e);
            reject(new Error('Erro no HLS nativo'));
          };
          
          setTimeout(() => reject(new Error('Timeout HLS')), 15000);
        });
        
        return true;
      }
      
      // HLS.js para Chrome, Firefox, Edge
      if ((window as any).Hls) {
        console.log('PD Player - Usando HLS.js');
        const hls = new (window as any).Hls({
          enableWorker: true,
          lowLatencyMode: true,
          maxBufferLength: 2,
          maxMaxBufferLength: 4,
          backBufferLength: 1,
          maxBufferSize: 2 * 1000 * 1000, // 2 segundos
          maxBufferHole: 0.5,
          highBufferWatchdogPeriod: 2,
          nudgeOffset: 0.1,
          nudgeMaxOffset: 0.5,
          maxFragLookUpTolerance: 0.25,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: Infinity,
          liveDurationInfinity: true,
          preferManagedMediaSource: true,
          debug: false
        });
        
        hls.loadSource(hlsUrl);
        hls.attachMedia(videoEl);
        
        await new Promise<void>((resolve, reject) => {
          hls.on((window as any).Hls.Events.MANIFEST_PARSED, () => {
            videoEl.play().catch(e => console.warn('Auto-play bloqueado:', e));
            resolve();
          });
          
          hls.on((window as any).Hls.Events.ERROR, (event, data) => {
            console.error('HLS.js error:', data);
            if (data.fatal) {
              reject(new Error('Erro fatal no HLS.js'));
            }
          });
          
          setTimeout(() => reject(new Error('Timeout HLS.js')), 15000);
        });
        
        return true;
      }
      
      throw new Error('HLS não suportado');
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
        // Usar servidor SRS próprio
        webrtcUrl = srsService.getWebRTCPlayUrl(streamer.id);
      }
      
      console.log('PD Player - WebRTC URL:', webrtcUrl);
      
      // Verificar suporte WebRTC
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSupported = navigator.mediaDevices && navigator.mediaDevices.getUserMedia && 
                          window.RTCPeerConnection || (window as any).webkitRTCPeerConnection || 
                          (window as any).mozRTCPeerConnection;
      
      if (!isSupported) {
        console.warn('WebRTC não suportado neste navegador');
        return false;
      }
      
      // Configuração com servidores próprios (sem Google)
      // O webrtcService já usa as configurações ICE centralizadas
      const webRTCConfig = isMobile ? 
        { iceTransportPolicy: 'relay', bundlePolicy: 'max-bundle' } : 
        { iceTransportPolicy: 'all', bundlePolicy: 'balanced' };
      
      // Usar WHEP com streamerId real (padrão SRS)
      const streamerId = streamer?.id;
      if (!streamerId) {
        throw new Error('ID do streamer não encontrado');
      }
      
      console.log('🔗 Iniciando WebRTC WHEP para streamerId:', streamerId);
      const remoteStream = await webRTCService.startPlay(streamerId);
      
      if (remoteStream) {
        videoEl.srcObject = remoteStream;
        videoEl.muted = false;
        videoEl.volume = 1.0;
        
        // Otimizações para mobile
        if (isMobile) {
          videoEl.setAttribute('playsinline', 'true');
          videoEl.setAttribute('webkit-playsinline', 'true');
          videoEl.setAttribute('x5-playsinline', 'true');
          videoEl.setAttribute('x5-video-player-type', 'h5');
        }
        
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

      {/* Elemento de vídeo - preenche toda a tela sem faixas pretas */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted={currentUser.id === streamer.hostId}
        autoPlay={true}
        controls={false}
        key={`pd-player-${streamer.id}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center'
        }}
      />
    </div>
  );
};

export default PDVideoPlayer;
