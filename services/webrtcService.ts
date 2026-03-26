import { api } from './api';
import { iceManager, ICEManagerService } from './iceManagerService';

export type WebRTCState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

export class WebRTCService {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private state: WebRTCState = 'idle';
  private statsInterval: any = null;
  private currentStreamUrl: string | null = null;
  private currentStreamId: string | null = null;

  // Configuração ICE usando o gerenciador unificado
  private getIceConfig(): RTCConfiguration {
    return iceManager.getICEConfig();
  }

  constructor() {
    this.initializeICE();
  }

  /**
   * Inicializar gerenciador ICE
   */
  private async initializeICE(): Promise<void> {
    try {
      // ICE Manager temporariamente desabilitado para evitar erros de inicialização
      // await iceManager.initialize();
      // console.log('✅ [WebRTC] ICE Manager inicializado');
    } catch (error) {
      // Silenciado para não poluir console
    }
  }

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

  // --- PUBLISH FLOW (WHIP) ---

  public async startPublish(userId: string, mediaStream?: MediaStream, retryCount: number = 3): Promise<MediaStream> {
    this.currentStreamId = userId;
    
    this.state = 'connecting';
    
    try {
      // Usar mediaStream fornecido ou capturar novo
      if (!this.localStream && !mediaStream) {
        try {
          console.log('Capturando nova mídia local...');
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720, frameRate: 30 },
            audio: true
          });
        } catch (e) {
          throw new Error('Falha na captura de mídia');
        }
      } else if (mediaStream) {
        // USAR MEDIA STREAM FORNECIDO (do WebViewStreamPlayer)
        this.localStream = mediaStream;
        console.log('Usando mediaStream fornecido:', mediaStream.getVideoTracks().length, 'tracks');
      }

      // 2. Inicializar PeerConnection com nosso ICE
      this.cleanupPeerConnection();
      
      this.pc = new RTCPeerConnection({
        ...this.getIceConfig(),
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      });

      // Debug ICE State
      this.pc.oniceconnectionstatechange = () => {
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

      // 5. Enviar para backend usando WHIP (userId real)
      const response = await api.publishWebRTC(userId, finalOfferSdp);
      
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
      } else {
          throw new Error('Falha no handshake WHIP');
      }

      return this.localStream;

    } catch (error) {
      if (retryCount > 0) {
          await new Promise(r => setTimeout(r, 2000));
          return this.startPublish(userId, mediaStream, retryCount - 1);
      }
      this.state = 'failed';
      this.stop();
      throw error;
    }
  }

  // --- PLAYBACK FLOW (WHEP) ---

  public async startPlay(streamId: string, retryCount = 3): Promise<MediaStream> {
     this.currentStreamId = streamId;
     
     this.state = 'connecting';
     
     try {
        this.cleanupPeerConnection();
        
        this.pc = new RTCPeerConnection({
        ...this.getIceConfig(),
        bundlePolicy: 'max-bundle'
      });

        this.pc.addTransceiver('audio', { direction: 'recvonly' });
        this.pc.addTransceiver('video', { direction: 'recvonly' });

        this.remoteStream = new MediaStream();
        this.pc.ontrack = (event) => {
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

        // Enviar para backend usando WHEP (streamId real)
        const response = await api.playWebRTC(streamId, finalOffer);
        
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
        } else {
             throw new Error('Falha no handshake WHEP');
        }

        return this.remoteStream!;

     } catch (error) {
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
