import { api } from './api';

export type WebRTCState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

export class WebRTCService {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private state: WebRTCState = 'idle';
  private statsInterval: any = null;
  private currentStreamUrl: string | null = null;
  private currentStreamId: string | null = null;

  // Configuração ICE com STUN/TURN do nosso servidor
  private readonly iceConfig: RTCIceServer[] = [
    {
      urls: import.meta.env?.VITE_STUN_SERVER_URL || 'stun:localhost:3478',
    },
    {
      urls: import.meta.env?.VITE_TURN_SERVER_URL || 'turn:localhost:3478',
      username: import.meta.env?.VITE_TURN_USERNAME || 'livego',
      credential: import.meta.env?.VITE_TURN_PASSWORD || 'livego123'
    }
  ];

  constructor() {}

  // --- HELPER: Format & Sanitize SDP ---
  private formatSDP(sdp: string): string {
      const lines = sdp.replace(/\r\n/g, '\n').split('\n');
      const newLines: string[] = [];

      for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === '') continue;

          // SAFETY FILTER: Remove lines that cause negotiation failure in modern browsers
          if (trimmed.includes('extmap-allow-mixed')) continue;
          if (trimmed.includes('transport-cc')) continue;
          if (trimmed.includes('goog-remb')) continue;

          newLines.push(trimmed);
      }

      // Ensure CRLF
      return newLines.join('\r\n') + '\r\n';
  }

  // --- PUBLISH FLOW ---

  public async startPublish(streamId: string, streamKey: string, retryCount = 3): Promise<MediaStream> {
    this.currentStreamId = streamId;
    const webrtcUrl = import.meta.env?.VITE_SRS_WEBRTC_URL || 'webrtc://localhost/live';
    this.currentStreamUrl = `${webrtcUrl}/${streamId}`;
    this.state = 'connecting';
    console.log(`[WebRTC Service] Iniciando publicação para stream ${streamId} via ${webrtcUrl} (Retries: ${retryCount})`);
    
    try {
      // 1. Capturar mídia local
      if (!this.localStream) {
          try {
              this.localStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720, frameRate: 30 },
                audio: true
              });
              console.log('[WebRTC Service] Mídia local capturada com sucesso');
          } catch (e) {
              console.error('[WebRTC Service] Falha ao capturar mídia local', e);
              throw new Error('Falha na captura de mídia');
          }
      }

      // 2. Inicializar PeerConnection com nosso ICE
      this.cleanupPeerConnection();
      
      this.pc = new RTCPeerConnection({
        iceServers: this.iceConfig,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      });

      // Debug ICE State
      this.pc.oniceconnectionstatechange = () => {
          console.log(`[WebRTC Service] Estado ICE: ${this.pc?.iceConnectionState}`);
      };

      // 3. Adicionar tracks
      this.localStream.getTracks().forEach(track => {
        if (this.pc && this.localStream) {
            this.pc.addTrack(track, this.localStream);
        }
      });

      // 4. Criar Offer
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      
      // Esperar coleta de ICE completar
      if (this.pc.iceGatheringState !== 'complete') {
          await new Promise<void>(resolve => {
              const checkGathering = () => {
                  if (this.pc?.iceGatheringState === 'complete') {
                      this.pc.removeEventListener('icegatheringstatechange', checkGathering);
                      resolve();
                  }
              };
              this.pc?.addEventListener('icegatheringstatechange', checkGathering);
              setTimeout(resolve, 3000); // Aumentar timeout para nosso servidor
          });
      }

      const finalOfferSdp = this.pc.localDescription?.sdp;
      if (!finalOfferSdp) throw new Error('Falha ao gerar SDP offer');

      console.log('[WebRTC Service] Offer gerado com ICE candidates');

      // 5. Enviar para nosso backend SRS
      const response = await api.publishWebRTC(this.currentStreamUrl, finalOfferSdp, streamKey);
      
      if (response && response.code === 0 && response.sdp) {
          if (!this.pc) throw new Error('Conexão fechada durante negociação');
          if (this.pc.signalingState === 'stable') return this.localStream;

          const formattedSdp = this.formatSDP(response.sdp);
          await this.pc.setRemoteDescription(new RTCSessionDescription({
              type: 'answer',
              sdp: formattedSdp
          }));
          
          this.state = 'connected';
          this.startStatsMonitoring();
          console.log('[WebRTC Service] Conexão de publish estabelecida');
      } else {
          throw new Error('Falha no handshake SRS');
      }

      return this.localStream;

    } catch (error) {
      console.error('[WebRTC Service] Erro ao iniciar publish:', error);
      if (retryCount > 0) {
          await new Promise(r => setTimeout(r, 2000));
          return this.startPublish(streamId, streamKey, retryCount - 1);
      }
      this.state = 'failed';
      this.stop();
      throw error;
    }
  }

  // --- PLAYBACK FLOW ---

  public async startPlay(streamId: string, retryCount = 3): Promise<MediaStream> {
     this.currentStreamId = streamId;
     const webrtcUrl = import.meta.env?.VITE_SRS_WEBRTC_URL || 'webrtc://localhost/live';
     this.currentStreamUrl = `${webrtcUrl}/${streamId}`;
     this.state = 'connecting';
     console.log(`[WebRTC Service] Iniciando playback da stream ${streamId} via ${webrtcUrl} (Retries: ${retryCount})`);
     
     try {
        this.cleanupPeerConnection();
        
        this.pc = new RTCPeerConnection({
             iceServers: this.iceConfig,
             bundlePolicy: 'max-bundle'
        });

        this.pc.addTransceiver('audio', { direction: 'recvonly' });
        this.pc.addTransceiver('video', { direction: 'recvonly' });

        this.remoteStream = new MediaStream();
        this.pc.ontrack = (event) => {
            console.log(`[WebRTC Service] Track recebido: ${event.track.kind}`);
            if (this.remoteStream) this.remoteStream.addTrack(event.track);
        };

        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);

        if (this.pc.iceGatheringState !== 'complete') {
             await new Promise<void>(resolve => {
                  const check = () => { 
                      if (this.pc?.iceGatheringState === 'complete') {
                          this.pc?.removeEventListener('icegatheringstatechange', check);
                          resolve();
                      }
                  };
                  this.pc?.addEventListener('icegatheringstatechange', check);
                  setTimeout(resolve, 3000); // Timeout para nosso servidor
             });
        }
        
        const finalOffer = this.pc.localDescription?.sdp;
        if (!finalOffer) throw new Error('Falha ao gerar SDP offer para playback');

        // Enviar para nosso backend SRS
        const response = await api.playWebRTC(this.currentStreamUrl, finalOffer);
        
        if (response && response.code === 0 && response.sdp) {
             if (!this.pc) throw new Error('Conexão fechada durante negociação');
             if (this.pc.signalingState === 'stable') return this.remoteStream!;

             const formattedSdp = this.formatSDP(response.sdp);
             await this.pc.setRemoteDescription(new RTCSessionDescription({
                 type: 'answer',
                 sdp: formattedSdp
             }));
             
             this.state = 'connected';
             this.startStatsMonitoring();
             console.log('[WebRTC Service] Conexão de playback estabelecida');
        } else {
             throw new Error('Falha no handshake SRS para playback');
        }

        return this.remoteStream!;

     } catch (error) {
        console.error('[WebRTC Service] Erro ao iniciar playback:', error);
        if (retryCount > 0) {
            await new Promise(r => setTimeout(r, 2000));
            return this.startPlay(streamId, retryCount - 1);
        }
        this.state = 'failed';
        this.stop();
        throw error;
     }
  }

  // --- UTILS ---

  private setupICELogging() {
      if (!this.pc) return;
      this.pc.onconnectionstatechange = () => {
          const state = this.pc?.connectionState;
          console.log(`[WebRTC Service] Connection State: ${state}`);
          if (state === "failed" || state === "closed") this.stopStatsMonitoring();
      };
  }

  private startStatsMonitoring() {
      this.stopStatsMonitoring();
      this.statsInterval = setInterval(async () => {
          if (this.pc && this.state === 'connected') {
              try { await this.pc.getStats(); } catch (e) {}
          }
      }, 5000);
  }

  private stopStatsMonitoring() {
      if (this.statsInterval) {
          clearInterval(this.statsInterval);
          this.statsInterval = null;
      }
  }

  public getLocalStream(): MediaStream | null { return this.localStream; }
  public getRemoteStream(): MediaStream | null { return this.remoteStream; }
  public getState(): WebRTCState { return this.state; }
  public getCurrentStreamId(): string | null { return this.currentStreamId; }

  private cleanupPeerConnection() {
      if (this.pc) {
          this.pc.close();
          this.pc = null;
      }
  }

  public stop() {
    this.stopStatsMonitoring();
    this.state = 'idle';

    if (this.currentStreamUrl) {
        api.stopWebRTC(this.currentStreamUrl).catch(() => {});
        this.currentStreamUrl = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    if (this.remoteStream) {
        this.remoteStream.getTracks().forEach(track => track.stop());
        this.remoteStream = null;
    }
    this.cleanupPeerConnection();
  }
}

export const webRTCService = new WebRTCService();
