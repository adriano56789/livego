import { useState, useEffect, useCallback } from 'react';
import { liveKitService, Room, RemoteParticipant, ConnectionState } from '../services/liveKitService';

/**
 * Hook personalizado para gerenciar LiveKit
 * Comentários em português conforme preferência do usuário
 */
export const useLiveKit = () => {
  // Estados do hook
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('Disconnected');
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false);

  /**
   * Conectar à sala
   */
  const conectar = useCallback(async (roomName: string, participantName: string, token?: string) => {
    try {
      setIsConnecting(true);
      setError(null);
      
      console.log(`🎯 Conectando via hook: ${roomName}`);
      
      const roomInstance = await liveKitService.conectarSala(roomName, participantName, token);
      
      setRoom(roomInstance);
      setIsConnected(true);
      
      return roomInstance;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ Erro no hook:', errorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  /**
   * Desconectar da sala
   */
  const desconectar = useCallback(async () => {
    try {
      await liveKitService.desconectar();
      
      setRoom(null);
      setIsConnected(false);
      setParticipants([]);
      setIsCameraEnabled(false);
      setIsMicrophoneEnabled(false);
      setError(null);
      
    } catch (error) {
      console.error('❌ Erro ao desconectar no hook:', error);
    }
  }, []);

  /**
   * Publicar câmera
   */
  const habilitarCamera = useCallback(async () => {
    try {
      await liveKitService.publicarCamera();
      setIsCameraEnabled(true);
      setIsMicrophoneEnabled(true); // Câmera inclui microfone
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao habilitar câmera';
      setError(errorMessage);
      throw error;
    }
  }, []);

  /**
   * Parar câmera
   */
  const desabilitarCamera = useCallback(async () => {
    try {
      await liveKitService.pararCamera();
      setIsCameraEnabled(false);
      setIsMicrophoneEnabled(false);
      
    } catch (error) {
      console.error('❌ Erro ao desabilitar câmera:', error);
    }
  }, []);

  /**
   * Alternar microfone
   */
  const alternarMicrofone = useCallback(async () => {
    try {
      await liveKitService.alternarMicrofone();
      setIsMicrophoneEnabled(!isMicrophoneEnabled);
      
    } catch (error) {
      console.error('❌ Erro ao alternar microfone:', error);
    }
  }, [isMicrophoneEnabled]);

  /**
   * Alternar câmera (frontal/traseira)
   */
  const trocarCamera = useCallback(async () => {
    try {
      await liveKitService.alternarCamera();
      
    } catch (error) {
      console.error('❌ Erro ao trocar câmera:', error);
    }
  }, []);

  /**
   * Obter informações da sala
   */
  const obterInfoSala = useCallback(() => {
    return liveKitService.obterInfoSala();
  }, []);

  /**
   * Configurar listeners de eventos
   */
  useEffect(() => {
    const handleParticipantConnected = (event: CustomEvent) => {
      const { participant } = event.detail;
      console.log(`👋 Hook: Participante conectou: ${participant.name}`);
      
      setParticipants(prev => {
        // Evitar duplicatas
        if (prev.find(p => p.sid === participant.sid)) {
          return prev;
        }
        return [...prev, participant];
      });
    };

    const handleParticipantDisconnected = (event: CustomEvent) => {
      const { participant } = event.detail;
      console.log(`👋 Hook: Participante desconectou: ${participant.name}`);
      
      setParticipants(prev => prev.filter(p => p.sid !== participant.sid));
    };

    const handleConnectionStateChanged = (event: CustomEvent) => {
      const { state } = event.detail;
      console.log(`🔗 Hook: Estado da conexão: ${state}`);
      
      setConnectionState(state);
      
      if (state === 'Connected') {
        setIsConnected(true);
        setError(null);
      } else if (state === 'Disconnected') {
        setIsConnected(false);
      }
    };

    const handleDisconnected = (event: CustomEvent) => {
      const { reason } = event.detail;
      console.log(`🔌 Hook: Desconectado: ${reason}`);
      
      setIsConnected(false);
      setRoom(null);
      setParticipants([]);
      setIsCameraEnabled(false);
      setIsMicrophoneEnabled(false);
      
      if (reason) {
        setError(`Desconectado: ${reason}`);
      }
    };

    // Adicionar listeners
    window.addEventListener('livekit-participant-connected', handleParticipantConnected as EventListener);
    window.addEventListener('livekit-participant-disconnected', handleParticipantDisconnected as EventListener);
    window.addEventListener('livekit-connection-state-changed', handleConnectionStateChanged as EventListener);
    window.addEventListener('livekit-disconnected', handleDisconnected as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('livekit-participant-connected', handleParticipantConnected as EventListener);
      window.removeEventListener('livekit-participant-disconnected', handleParticipantDisconnected as EventListener);
      window.removeEventListener('livekit-connection-state-changed', handleConnectionStateChanged as EventListener);
      window.removeEventListener('livekit-disconnected', handleDisconnected as EventListener);
    };
  }, []);

  /**
   * Cleanup ao desmontar
   */
  useEffect(() => {
    return () => {
      if (isConnected) {
        console.log('🧹 Hook: Limpando conexão LiveKit');
        liveKitService.desconectar();
      }
    };
  }, [isConnected]);

  // Retornar estado e funções
  return {
    // Estados
    room,
    isConnected,
    isConnecting,
    connectionState,
    participants,
    error,
    isCameraEnabled,
    isMicrophoneEnabled,
    
    // Funções
    conectar,
    desconectar,
    habilitarCamera,
    desabilitarCamera,
    alternarMicrofone,
    trocarCamera,
    obterInfoSala,
    
    // Utilitários
    participantCount: participants.length + (isConnected ? 1 : 0),
    isReady: isConnected && !isConnecting,
  };
};