// Componente VideoPlayer Simples com streamUrl
import React, { useEffect, useRef, useState } from 'react';

interface SecureVideoPlayerProps {
  streamer: {
    id: string;
    hostId: string;
    playbackUrl?: string;
    displayName?: string;
  };
  streamUrl?: string;
  className?: string;
  onVideoReady?: () => void;
  onVideoError?: (error: string) => void;
  currentUser: {
    id: string;
  };
  isPublisher?: boolean;
}

const SecureVideoPlayer: React.FC<SecureVideoPlayerProps> = ({
  streamer,
  streamUrl,
  className = '',
  onVideoReady,
  onVideoError,
  currentUser,
  isPublisher = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [protocol, setProtocol] = useState<string>('');

  // Inicializar componente
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    setConnectionStatus('connecting');
    setError(null);
    setIsLoading(true);

    // Resetar vídeo
    videoEl.pause();
    videoEl.srcObject = null;

    // Usar streamUrl fornecida ou playbackUrl do streamer
    const videoSrc = streamUrl || streamer.playbackUrl;
    
    if (!videoSrc) {
      setError('Nenhuma URL de stream fornecida');
      setConnectionStatus('error');
      setIsLoading(false);
      onVideoError?.('Nenhuma URL de stream fornecida');
      return;
    }

    videoEl.src = videoSrc;

    videoEl.addEventListener('loadstart', () => {
      console.log('📺 Iniciando carregamento:', videoSrc);
    });

    videoEl.addEventListener('canplay', () => {
      console.log('✅ Vídeo pronto para reproduzir:', videoSrc);
      setConnectionStatus('connected');
      setIsLoading(false);
      onVideoReady?.();
    });

    videoEl.addEventListener('error', (e) => {
      console.error('❌ Erro no vídeo:', e);
      setError('Falha ao carregar stream');
      setConnectionStatus('error');
      onVideoError?.('Falha ao carregar stream');
    });

    videoEl.play().catch(e => console.warn('⚠️ Auto-play bloqueado, aguardando interação'));
  }, [streamer.id, streamUrl, streamer.playbackUrl]);

  // Status colors
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando...';
      case 'error': return 'Erro';
      default: return 'Desconectado';
    }
  };

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Vídeo */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay={isPublisher}
        playsInline
        muted={isPublisher}
        controls={!isPublisher}
      />

      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">
              {connectionStatus === 'connecting' ? 'Conectando...' : 'Carregando...'}
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-center text-white p-6">
            <div className="text-red-500 text-xl mb-2">⚠️ Erro de Conexão</div>
            <p className="mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                // Tentar novamente
                const videoEl = videoRef.current;
                if (videoEl) {
                  const videoSrc = streamUrl || streamer.playbackUrl;
                  if (videoSrc) {
                    videoEl.src = videoSrc;
                    videoEl.play().catch(e => console.warn('Auto-play bloqueado, aguardando interação'));
                  }
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
        <div className={`font-semibold ${getStatusColor()}`}>
          {getStatusText()}
        </div>
        {protocol && (
          <div className="text-xs text-gray-300">
            {protocol.toUpperCase()}
          </div>
        )}
      </div>

      {/* Stream Info */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
        <div className="font-semibold">
          {streamer.displayName || 'Live Stream'}
        </div>
        <div className="text-xs text-gray-300">
          ID: {streamer.id.substring(0, 20)}...
        </div>
      </div>

      {/* Security Badge */}
      <div className="absolute bottom-4 left-4 bg-green-500 bg-opacity-75 text-white px-2 py-1 rounded text-xs">
        🔐 Stream Seguro
      </div>
    </div>
  );
};

export default SecureVideoPlayer;
