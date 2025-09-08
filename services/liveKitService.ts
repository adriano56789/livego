import { 
  Room, 
  RoomEvent, 
  RemoteParticipant, 
  LocalParticipant,
  Track,
  VideoTrack,
  AudioTrack,
  RemoteTrackPublication,
  LocalTrackPublication,
  ConnectionState,
  RoomConnectOptions,
  CreateLocalTracksOptions,
  TrackPublication,
  RemoteTrack,
  DisconnectReason
} from 'livekit-client';

// Configuração do LiveKit
const LIVEKIT_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'ws://localhost:7880'
  : 'wss://livekit.yourdomain.com';

// Chaves da API (em produção, essas devem vir do backend)
const API_KEY = 'devkey';
const API_SECRET = 'secret';

/**
 * Serviço para gerenciar conexões WebRTC usando LiveKit
 * Comentários em português conforme preferência do usuário
 */
class LiveKitService {
  private room: Room | null = null;
  private localParticipant: LocalParticipant | null = null;
  private isConnected: boolean = false;

  constructor() {
    console.log('🎥 Serviço LiveKit inicializado');
    console.log(`🔗 URL do servidor: ${LIVEKIT_URL}`);
  }

  /**
   * Conectar à sala do LiveKit
   * @param roomName Nome da sala
   * @param participantName Nome do participante
   * @param token Token de acesso (se fornecido)
   */
  async conectarSala(
    roomName: string, 
    participantName: string, 
    token?: string
  ): Promise<Room> {
    try {
      console.log(`🚀 Conectando à sala: ${roomName}`);
      console.log(`👤 Participante: ${participantName}`);

      // Criar nova instância da sala
      this.room = new Room();

      // Configurar listeners de eventos
      this.configurarEventos();

      // Opções de conexão
      const connectOptions: RoomConnectOptions = {
        autoSubscribe: true,
      };

      // Se não tiver token, usar um token básico (para desenvolvimento)
      const accessToken = token || this.gerarTokenBasico(roomName, participantName);

      // Conectar à sala
      await this.room.connect(LIVEKIT_URL, accessToken, connectOptions);

      this.localParticipant = this.room.localParticipant;
      this.isConnected = true;

      console.log('✅ Conectado à sala com sucesso!');
      console.log(`🏠 Sala: ${this.room.name}`);
      console.log(`🆔 Participante ID: ${this.localParticipant.sid}`);

      return this.room;

    } catch (error) {
      console.error('❌ Erro ao conectar à sala:', error);
      throw new Error(`Falha na conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Desconectar da sala
   */
  async desconectar(): Promise<void> {
    if (this.room) {
      console.log('🔌 Desconectando da sala...');
      
      try {
        await this.room.disconnect();
        this.room = null;
        this.localParticipant = null;
        this.isConnected = false;
        
        console.log('✅ Desconectado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao desconectar:', error);
      }
    }
  }

  /**
   * Publicar câmera e microfone
   */
  async publicarCamera(): Promise<LocalTrackPublication[]> {
    if (!this.room || !this.localParticipant) {
      throw new Error('Não conectado à sala');
    }

    try {
      console.log('📹 Iniciando publicação da câmera...');

      // Publicar câmera e microfone
      await this.localParticipant.enableCameraAndMicrophone();
      
      const videoTracks = Array.from(this.localParticipant.videoTrackPublications.values());
      const audioTracks = Array.from(this.localParticipant.audioTrackPublications.values());
      const allTracks = [...videoTracks, ...audioTracks];
      
      console.log('✅ Câmera e microfone publicados com sucesso');
      console.log(`🎥 Tracks publicadas: ${allTracks.length}`);

      return allTracks;

    } catch (error) {
      console.error('❌ Erro ao publicar câmera:', error);
      throw new Error(`Falha na publicação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Parar publicação da câmera
   */
  async pararCamera(): Promise<void> {
    if (this.localParticipant) {
      console.log('⏹️ Parando câmera...');
      
      try {
        await this.localParticipant.setCameraEnabled(false);
        await this.localParticipant.setMicrophoneEnabled(false);
        
        console.log('✅ Câmera e microfone desabilitados');
      } catch (error) {
        console.error('❌ Erro ao parar câmera:', error);
      }
    }
  }

  /**
   * Alternar câmera (frontal/traseira)
   */
  async alternarCamera(): Promise<void> {
    if (this.localParticipant) {
      try {
        console.log('🔄 Alternando câmera...');
        
        const videoTrack = this.localParticipant.videoTrackPublications.values().next().value;
        if (videoTrack && videoTrack.track && videoTrack.track.kind === 'video') {
          await (videoTrack.track as any).switchCamera();
          console.log('✅ Câmera alternada');
        }
      } catch (error) {
        console.error('❌ Erro ao alternar câmera:', error);
      }
    }
  }

  /**
   * Alternar microfone (ligar/desligar)
   */
  async alternarMicrofone(): Promise<void> {
    if (this.localParticipant) {
      try {
        const audioTrack = this.localParticipant.audioTrackPublications.values().next().value;
        const isEnabled = audioTrack?.isMuted === false;
        
        await this.localParticipant.setMicrophoneEnabled(!isEnabled);
        
        console.log(`🎤 Microfone ${!isEnabled ? 'ligado' : 'desligado'}`);
      } catch (error) {
        console.error('❌ Erro ao alternar microfone:', error);
      }
    }
  }

  /**
   * Configurar eventos da sala
   */
  private configurarEventos(): void {
    if (!this.room) return;

    // Participante conectou
    this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      console.log(`👋 Participante conectou: ${participant.name || participant.sid}`);
      
      // Emitir evento customizado para o React
      window.dispatchEvent(new CustomEvent('livekit-participant-connected', {
        detail: { participant }
      }));
    });

    // Participante desconectou
    this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      console.log(`👋 Participante desconectou: ${participant.name || participant.sid}`);
      
      window.dispatchEvent(new CustomEvent('livekit-participant-disconnected', {
        detail: { participant }
      }));
    });

    // Nova track publicada
    this.room.on(RoomEvent.TrackSubscribed, (
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant
    ) => {
      console.log(`🎥 Nova track: ${publication.source} de ${participant.name || participant.sid}`);
      
      window.dispatchEvent(new CustomEvent('livekit-track-subscribed', {
        detail: { track, publication, participant }
      }));
    });

    // Track removida
    this.room.on(RoomEvent.TrackUnsubscribed, (
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant
    ) => {
      console.log(`🎥 Track removida: ${publication.source} de ${participant.name || participant.sid}`);
      
      window.dispatchEvent(new CustomEvent('livekit-track-unsubscribed', {
        detail: { track, publication, participant }
      }));
    });

    // Estado da conexão mudou
    this.room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
      console.log(`🔗 Estado da conexão: ${state}`);
      
      window.dispatchEvent(new CustomEvent('livekit-connection-state-changed', {
        detail: { state }
      }));
    });

    // Desconectado
    this.room.on(RoomEvent.Disconnected, (reason?: DisconnectReason) => {
      console.log(`🔌 Desconectado da sala. Motivo: ${reason || 'Não especificado'}`);
      this.isConnected = false;
      
      window.dispatchEvent(new CustomEvent('livekit-disconnected', {
        detail: { reason }
      }));
    });
  }

  /**
   * Gerar token básico para desenvolvimento (NÃO usar em produção!)
   */
  private gerarTokenBasico(roomName: string, participantName: string): string {
    // AVISO: Em produção, o token deve ser gerado no backend!
    console.warn('⚠️ Usando token básico de desenvolvimento');
    
    // Para desenvolvimento, vamos usar um token simples
    // Em produção, isso deve vir do seu backend via /api/livekit/token
    return `dev-token-${roomName}-${participantName}-${Date.now()}`;
  }

  /**
   * Obter informações da sala atual
   */
  obterInfoSala(): {
    isConnected: boolean;
    roomName?: string;
    participantCount?: number;
    localParticipantSid?: string;
  } {
    return {
      isConnected: this.isConnected,
      roomName: this.room?.name,
      participantCount: this.room?.numParticipants,
      localParticipantSid: this.localParticipant?.sid,
    };
  }

  /**
   * Obter a instância da sala atual
   */
  obterRoom(): Room | null {
    return this.room;
  }
}

// Instância singleton do serviço LiveKit
export const liveKitService = new LiveKitService();

// Exportar tipos úteis
export type {
  Room,
  RemoteParticipant,
  LocalParticipant,
  VideoTrack,
  AudioTrack,
  ConnectionState,
};