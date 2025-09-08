import React, { useState, useEffect, useRef } from 'react';
import { liveKitService, Room, RemoteParticipant, ConnectionState } from '../services/liveKitService';

interface LiveKitRoomProps {
  roomName: string;
  participantName: string;
  onDisconnect?: () => void;
}

/**
 * Componente para sala LiveKit
 * Comentários em português conforme preferência do usuário
 */
export const LiveKitRoom: React.FC<LiveKitRoomProps> = ({
  roomName,
  participantName,
  onDisconnect
}) => {
  // Estados do componente
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('Disconnected');
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Referências para elementos de vídeo
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<{ [key: string]: HTMLVideoElement }>({});

  /**
   * Conectar à sala
   */
  const conectar = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      console.log(`🎯 Tentando conectar à sala: ${roomName}`);
      
      const room = await liveKitService.conectarSala(roomName, participantName);
      
      setIsConnected(true);
      
      // Configurar vídeo local se disponível
      if (localVideoRef.current && room.localParticipant) {
        const videoTrackPublication = room.localParticipant.videoTrackPublications.values().next().value;
        if (videoTrackPublication && videoTrackPublication.track) {
          videoTrackPublication.track.attach(localVideoRef.current);
        }
      }
      
    } catch (error) {
      console.error('❌ Erro na conexão:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Desconectar da sala
   */
  const desconectar = async () => {
    try {
      await liveKitService.desconectar();
      setIsConnected(false);
      setIsCameraOn(false);
      setIsMicOn(false);
      onDisconnect?.();
    } catch (error) {
      console.error('❌ Erro ao desconectar:', error);
    }
  };

  /**
   * Ligar/desligar câmera
   */
  const alternarCamera = async () => {
    try {
      if (isCameraOn) {
        await liveKitService.pararCamera();
        setIsCameraOn(false);
      } else {
        await liveKitService.publicarCamera();
        setIsCameraOn(true);
        setIsMicOn(true); // Câmera inclui microfone
      }
    } catch (error) {
      console.error('❌ Erro ao alternar câmera:', error);
      setError('Erro ao acessar câmera');
    }
  };

  /**
   * Ligar/desligar microfone
   */
  const alternarMicrofone = async () => {
    try {
      await liveKitService.alternarMicrofone();
      setIsMicOn(!isMicOn);
    } catch (error) {
      console.error('❌ Erro ao alternar microfone:', error);
    }
  };

  /**
   * Configurar listeners de eventos do LiveKit
   */
  useEffect(() => {
    const handleParticipantConnected = (event: CustomEvent) => {
      const { participant } = event.detail;
      console.log(`👋 Participante conectou no React: ${participant.name}`);
      
      setParticipants(prev => [...prev, participant]);
    };

    const handleParticipantDisconnected = (event: CustomEvent) => {
      const { participant } = event.detail;
      console.log(`👋 Participante desconectou no React: ${participant.name}`);
      
      setParticipants(prev => prev.filter(p => p.sid !== participant.sid));
    };

    const handleConnectionStateChanged = (event: CustomEvent) => {
      const { state } = event.detail;
      setConnectionState(state);
      
      if (state === 'Connected') {
        setIsConnected(true);
      } else if (state === 'Disconnected') {
        setIsConnected(false);
      }
    };

    const handleTrackSubscribed = (event: CustomEvent) => {
      const { track, participant } = event.detail;
      console.log(`🎥 Nova track recebida: ${track.source}`);
      
      // Anexar track de vídeo ao elemento correspondente
      if (track.kind === 'video') {
        const videoElement = remoteVideosRef.current[participant.sid];
        if (videoElement && track.track) {
          track.track.attach(videoElement);
        }
      }
    };

    const handleDisconnected = (event: CustomEvent) => {
      const { reason } = event.detail;
      console.log(`🔌 Desconectado: ${reason}`);
      
      setIsConnected(false);
      setParticipants([]);
      setError(reason || 'Desconectado do servidor');
    };

    // Adicionar listeners
    window.addEventListener('livekit-participant-connected', handleParticipantConnected as EventListener);
    window.addEventListener('livekit-participant-disconnected', handleParticipantDisconnected as EventListener);
    window.addEventListener('livekit-connection-state-changed', handleConnectionStateChanged as EventListener);
    window.addEventListener('livekit-track-subscribed', handleTrackSubscribed as EventListener);
    window.addEventListener('livekit-disconnected', handleDisconnected as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('livekit-participant-connected', handleParticipantConnected as EventListener);
      window.removeEventListener('livekit-participant-disconnected', handleParticipantDisconnected as EventListener);
      window.removeEventListener('livekit-connection-state-changed', handleConnectionStateChanged as EventListener);
      window.removeEventListener('livekit-track-subscribed', handleTrackSubscribed as EventListener);
      window.removeEventListener('livekit-disconnected', handleDisconnected as EventListener);
    };
  }, []);

  /**
   * Cleanup ao desmontar componente
   */
  useEffect(() => {
    return () => {
      if (isConnected) {
        liveKitService.desconectar();
      }
    };
  }, [isConnected]);

  return (
    <div className="livekit-room">
      <div className="room-header">
        <h2>🎥 Sala LiveKit: {roomName}</h2>
        <div className="connection-info">
          <span className={`status ${connectionState.toLowerCase()}`}>
            {connectionState === 'Connected' ? '🟢 Conectado' : 
             connectionState === 'Connecting' ? '🟡 Conectando' : 
             '🔴 Desconectado'}
          </span>
          <span className="participant-count">
            👥 {participants.length + (isConnected ? 1 : 0)} participante(s)
          </span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          ❌ Erro: {error}
        </div>
      )}

      <div className="video-container">
        {/* Vídeo local */}
        <div className="local-video">
          <h3>📹 Você ({participantName})</h3>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="video-element local"
          />
        </div>

        {/* Vídeos remotos */}
        <div className="remote-videos">
          {participants.map(participant => (
            <div key={participant.sid} className="remote-video">
              <h3>👤 {participant.name || participant.identity}</h3>
              <video
                ref={el => {
                  if (el) {
                    remoteVideosRef.current[participant.sid] = el;
                  }
                }}
                autoPlay
                playsInline
                className="video-element remote"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="controls">
        {!isConnected ? (
          <button
            onClick={conectar}
            disabled={isConnecting}
            className="connect-button"
          >
            {isConnecting ? '🔄 Conectando...' : '🚀 Conectar à Sala'}
          </button>
        ) : (
          <div className="control-buttons">
            <button
              onClick={alternarCamera}
              className={`control-button ${isCameraOn ? 'active' : 'inactive'}`}
            >
              {isCameraOn ? '📹 Câmera Ligada' : '📷 Câmera Desligada'}
            </button>
            
            <button
              onClick={alternarMicrofone}
              className={`control-button ${isMicOn ? 'active' : 'inactive'}`}
            >
              {isMicOn ? '🎤 Mic Ligado' : '🔇 Mic Desligado'}
            </button>
            
            <button
              onClick={desconectar}
              className="disconnect-button"
            >
              🔌 Desconectar
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .livekit-room {
          padding: 20px;
          background: #f5f5f5;
          border-radius: 10px;
          margin: 20px 0;
        }

        .room-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #ddd;
        }

        .connection-info {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        .status {
          padding: 5px 10px;
          border-radius: 15px;
          font-weight: bold;
        }

        .status.connected {
          background: #d4edda;
          color: #155724;
        }

        .status.connecting {
          background: #fff3cd;
          color: #856404;
        }

        .status.disconnected {
          background: #f8d7da;
          color: #721c24;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 10px;
          border-radius: 5px;
          margin-bottom: 15px;
          border: 1px solid #f5c6cb;
        }

        .video-container {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .local-video, .remote-video {
          background: #000;
          border-radius: 10px;
          overflow: hidden;
        }

        .local-video h3, .remote-video h3 {
          background: rgba(0,0,0,0.7);
          color: white;
          margin: 0;
          padding: 10px;
          font-size: 14px;
        }

        .video-element {
          width: 100%;
          height: 200px;
          object-fit: cover;
          display: block;
        }

        .remote-videos {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        }

        .controls {
          text-align: center;
        }

        .control-buttons {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .connect-button, .control-button, .disconnect-button {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .connect-button {
          background: #007bff;
          color: white;
        }

        .connect-button:hover {
          background: #0056b3;
        }

        .connect-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .control-button.active {
          background: #28a745;
          color: white;
        }

        .control-button.inactive {
          background: #6c757d;
          color: white;
        }

        .control-button:hover {
          opacity: 0.8;
        }

        .disconnect-button {
          background: #dc3545;
          color: white;
        }

        .disconnect-button:hover {
          background: #c82333;
        }
      `}</style>
    </div>
  );
};