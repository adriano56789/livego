import React, { useState, useEffect } from 'react';
import { useLiveKit } from '../hooks/useLiveKit';
import { apiClient } from '../services/apiClient';

interface StreamData {
  titulo: string;
  nome_streamer: string;
  categoria: string;
  [key: string]: any;
}

interface StreamComLiveKitProps {
  streamId: string;
  userId: number;
  userName: string;
}

/**
 * Componente que integra LiveKit com o sistema de streams
 * Comentários em português conforme preferência do usuário
 */
export const StreamComLiveKit: React.FC<StreamComLiveKitProps> = ({
  streamId,
  userId,
  userName
}) => {
  // Estados locais
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Hook do LiveKit
  const {
    isConnected,
    isConnecting,
    connectionState,
    participants,
    error,
    isCameraEnabled,
    isMicrophoneEnabled,
    conectar,
    desconectar,
    habilitarCamera,
    desabilitarCamera,
    alternarMicrofone,
    participantCount,
    isReady
  } = useLiveKit();

  /**
   * Carregar dados da stream
   */
  useEffect(() => {
    const carregarStream = async () => {
      try {
        setIsLoading(true);
        
        console.log(`📺 Carregando stream: ${streamId}`);
        const dados = await apiClient<StreamData>(`/api/streams/${streamId}`);
        
        setStreamData(dados);
        console.log(`✅ Stream carregada: ${dados.titulo}`);
        
      } catch (error) {
        console.error('❌ Erro ao carregar stream:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (streamId) {
      carregarStream();
    }
  }, [streamId]);

  /**
   * Iniciar transmissão
   */
  const iniciarTransmissao = async () => {
    try {
      console.log('🚀 Iniciando transmissão LiveKit...');
      
      // Conectar à sala LiveKit usando o ID da stream
      await conectar(`stream-${streamId}`, userName);
      
      // Habilitar câmera automaticamente
      await habilitarCamera();
      
      // Marcar como streaming
      setIsStreaming(true);
      
      // Notificar o backend que a stream começou
      await apiClient(`/api/streams/${streamId}/join`, {
        method: 'POST',
        body: JSON.stringify({ userId })
      });
      
      console.log('✅ Transmissão iniciada com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao iniciar transmissão:', error);
    }
  };

  /**
   * Parar transmissão
   */
  const pararTransmissao = async () => {
    try {
      console.log('⏹️ Parando transmissão...');
      
      // Desabilitar câmera
      await desabilitarCamera();
      
      // Desconectar do LiveKit
      await desconectar();
      
      // Marcar como não streaming
      setIsStreaming(false);
      
      // Notificar o backend que a stream parou
      await apiClient(`/api/streams/${streamId}/leave`, {
        method: 'POST',
        body: JSON.stringify({ userId })
      });
      
      console.log('✅ Transmissão parada com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao parar transmissão:', error);
    }
  };

  if (isLoading) {
    return <div className="loading">🔄 Carregando stream...</div>;
  }

  if (!streamData) {
    return <div className="error">❌ Stream não encontrada</div>;
  }

  return (
    <div className="stream-livekit">
      {/* Cabeçalho da Stream */}
      <div className="stream-header">
        <h2>📺 {streamData.titulo}</h2>
        <div className="stream-info">
          <span className="streamer">👤 {streamData.nome_streamer}</span>
          <span className="category">🏷️ {streamData.categoria}</span>
          <span className="viewers">👥 {participantCount} espectador(es)</span>
        </div>
      </div>

      {/* Status da Conexão */}
      <div className="connection-status">
        <div className={`status-indicator ${connectionState.toLowerCase()}`}>
          {connectionState === 'Connected' ? '🟢 Conectado' : 
           connectionState === 'Connecting' ? '🟡 Conectando' : 
           '🔴 Desconectado'}
        </div>
        {error && (
          <div className="error-message">❌ {error}</div>
        )}
      </div>

      {/* Controles da Transmissão */}
      <div className="stream-controls">
        {!isStreaming ? (
          <button
            onClick={iniciarTransmissao}
            disabled={isConnecting}
            className="start-stream-button"
          >
            {isConnecting ? '🔄 Conectando...' : '🎥 Iniciar Transmissão'}
          </button>
        ) : (
          <div className="active-controls">
            <button
              onClick={alternarMicrofone}
              className={`control-button ${isMicrophoneEnabled ? 'active' : 'inactive'}`}
            >
              {isMicrophoneEnabled ? '🎤 Mic Ligado' : '🔇 Mic Desligado'}
            </button>
            
            <button
              onClick={isCameraEnabled ? desabilitarCamera : habilitarCamera}
              className={`control-button ${isCameraEnabled ? 'active' : 'inactive'}`}
            >
              {isCameraEnabled ? '📹 Câmera Ligada' : '📷 Câmera Desligada'}
            </button>
            
            <button
              onClick={pararTransmissao}
              className="stop-stream-button"
            >
              ⏹️ Parar Transmissão
            </button>
          </div>
        )}
      </div>

      {/* Lista de Participantes */}
      {participants.length > 0 && (
        <div className="participants-list">
          <h3>👥 Espectadores Conectados</h3>
          <div className="participants">
            {participants.map(participant => (
              <div key={participant.sid} className="participant">
                <span className="participant-name">
                  👤 {participant.name || participant.identity}
                </span>
                <span className="participant-id">
                  🆔 {participant.sid.substring(0, 8)}...
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informações Técnicas */}
      {isReady && (
        <div className="technical-info">
          <h4>🔧 Informações Técnicas</h4>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Sala:</span>
              <span className="value">stream-{streamId}</span>
            </div>
            <div className="info-item">
              <span className="label">Estado:</span>
              <span className="value">{connectionState}</span>
            </div>
            <div className="info-item">
              <span className="label">Participantes:</span>
              <span className="value">{participantCount}</span>
            </div>
            <div className="info-item">
              <span className="label">Câmera:</span>
              <span className="value">{isCameraEnabled ? 'Ativa' : 'Inativa'}</span>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .stream-livekit {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .stream-header {
          border-bottom: 2px solid #f0f0f0;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }

        .stream-header h2 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .stream-info {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          color: #666;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        }

        .status-indicator {
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 14px;
        }

        .status-indicator.connected {
          background: #d4edda;
          color: #155724;
        }

        .status-indicator.connecting {
          background: #fff3cd;
          color: #856404;
        }

        .status-indicator.disconnected {
          background: #f8d7da;
          color: #721c24;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 14px;
        }

        .stream-controls {
          margin-bottom: 25px;
        }

        .start-stream-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-size: 18px;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .start-stream-button:hover:not(:disabled) {
          background: #0056b3;
        }

        .start-stream-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .active-controls {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .control-button {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
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

        .stop-stream-button {
          background: #dc3545;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .stop-stream-button:hover {
          background: #c82333;
        }

        .participants-list {
          margin-bottom: 25px;
        }

        .participants-list h3 {
          margin: 0 0 15px 0;
          color: #333;
        }

        .participants {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        }

        .participant {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .participant-name {
          font-weight: bold;
          color: #333;
        }

        .participant-id {
          font-family: monospace;
          color: #666;
          font-size: 12px;
        }

        .technical-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
        }

        .technical-info h4 {
          margin: 0 0 15px 0;
          color: #333;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #dee2e6;
        }

        .info-item:last-child {
          border-bottom: none;
        }

        .label {
          font-weight: bold;
          color: #666;
        }

        .value {
          color: #333;
          font-family: monospace;
        }

        .loading, .error {
          text-align: center;
          padding: 40px;
          font-size: 18px;
        }

        .error {
          color: #dc3545;
        }
      `}</style>
    </div>
  );
};