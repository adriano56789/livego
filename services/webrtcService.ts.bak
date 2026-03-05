import { api } from './api';

export type WebRTCState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

export class WebRTCService {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private state: WebRTCState = 'idle';
  private statsInterval: any = null;
  private currentStreamUrl: string | null = null;

  // TURN Credentials
  private readonly turnConfig: RTCIceServer[] = [
    {
      urls: 'stun:stun.l.google.com:19302' // Fallback STUN
    },
    {
      urls: 'turn:72.60.249.175:3478',
      username: 'livego',
      credential: 'adriano123'
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

  public async startPublish(streamUrl: string, retryCount = 3): Promise<MediaStream> {
    this.currentStreamUrl = streamUrl;
    this.state = 'connecting';
    console.log(`[WebRTC Service] Starting publish flow to ${streamUrl} via TURN... (Retries left: ${retryCount})`);
    
    try {
      // 1. Capture Media
      if (!this.localStream) {
          try {
              this.localStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720, frameRate: 30 },
                audio: true
              });
          } catch (e) {
              console.error("[WebRTC Service] Failed to capture local media", e);
              throw new Error("Media capture failed");
          }
      }

      // 2. Initialize PeerConnection with TURN Config
      this.cleanupPeerConnection();
      
      this.pc = new RTCPeerConnection({
        iceServers: this.turnConfig,
        sdpSemantics: 'unified-plan',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      } as RTCConfiguration);

      // Debug ICE State
      this.pc.oniceconnectionstatechange = () => {
          console.log(`[WebRTC Service] ICE Connection State: ${this.pc?.iceConnectionState}`);
      };

      // 3. Add tracks
      this.localStream.getTracks().forEach(track => {
        if (this.pc && this.localStream) {
            this.pc.addTrack(track, this.localStream);
        }
      });

      // 4. Create Offer
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      
      // Wait for ICE Gathering to complete (important for SRS monolithic SDP)
      if (this.pc.iceGatheringState !== 'complete') {
          await new Promise<void>(resolve => {
              const checkGathering = () => {
                  if (this.pc?.iceGatheringState === 'complete') {
                      this.pc.removeEventListener('icegatheringstatechange', checkGathering);
                      resolve();
                  }
              };
              this.pc?.addEventListener('icegatheringstatechange', checkGathering);
              // Wait max 2 seconds for TURN candidates
              setTimeout(resolve, 2000); 
          });
      }

      const finalOfferSdp = this.pc.localDescription?.sdp;
      if (!finalOfferSdp) throw new Error("Failed to generate SDP offer");

      console.log("[WebRTC Service] Offer generated with ICE candidates.");

      // 5. Signal to simulated server via standardized api
      const response = await api.publishWebRTC(streamUrl, finalOfferSdp);
      
      if (response && response.code === 0 && response.sdp) {
          if (!this.pc) throw new Error("Connection closed during negotiation");
          if (this.pc.signalingState === 'stable') return this.localStream;

          const formattedSdp = this.formatSDP(response.sdp);
          await this.pc.setRemoteDescription(new RTCSessionDescription({
              type: 'answer',
              sdp: formattedSdp
          }));
          
          this.state = 'connected';
          this.startStatsMonitoring();
          this.setupICELogging();
          console.log("[WebRTC Service] Publish connection established successfully.");
      } else {
          throw new Error("SRS Handshake failed");
      }

      return this.localStream;

    } catch (error) {
      console.error('[WebRTC Service] Error starting publish:', error);
      if (retryCount > 0) {
          await new Promise(r => setTimeout(r, 1000));
          return this.startPublish(streamUrl, retryCount - 1);
      }
      this.state = 'failed';
      this.stop();
      throw error;
    }
  }

  // --- PLAYBACK FLOW ---

  public async startPlay(streamUrl: string, retryCount = 3): Promise<MediaStream> {
     this.currentStreamUrl = streamUrl;
     this.state = 'connecting';
     console.log(`[WebRTC Service] Starting playback flow from ${streamUrl}... (Retries left: ${retryCount})`);
     
     try {
        this.cleanupPeerConnection();
        
        this.pc = new RTCPeerConnection({
             iceServers: this.turnConfig,
             sdpSemantics: 'unified-plan',
             bundlePolicy: 'max-bundle'
        } as RTCConfiguration);

        this.pc.addTransceiver('audio', { direction: 'recvonly' });
        this.pc.addTransceiver('video', { direction: 'recvonly' });

        this.remoteStream = new MediaStream();
        this.pc.ontrack = (event) => {
            console.log(`[WebRTC Service] Received remote track: ${event.track.kind}`);
            if (this.remoteStream) this.remoteStream.addTrack(event.track);
        };

        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);

        if (this.pc.iceGatheringState !== 'complete') {
             await new Promise<void>(resolve => {
                  const check = () => { if (this.pc?.iceGatheringState === 'complete') resolve(); };
                  this.pc?.addEventListener('icegatheringstatechange', check);
                  setTimeout(resolve, 2000);
             });
        }
        
        const finalOffer = this.pc.localDescription?.sdp;
        if (!finalOffer) throw new Error("Failed to generate playback SDP offer");

        // Exchange SDP via standardized api
        const response = await api.playWebRTC(streamUrl, finalOffer);
        
        if (response && response.code === 0 && response.sdp) {
             if (!this.pc) throw new Error("Connection closed during negotiation");
             if (this.pc.signalingState === 'stable') return this.remoteStream!;

             const formattedSdp = this.formatSDP(response.sdp);
             await this.pc.setRemoteDescription(new RTCSessionDescription({
                 type: 'answer',
                 sdp: formattedSdp
             }));
             
             this.state = 'connected';
             this.startStatsMonitoring();
             this.setupICELogging();
        } else {
            throw new Error("SRS Playback Handshake failed");
        }

        return this.remoteStream;

     } catch (error) {
         console.error('[WebRTC Service] Error starting playback:', error);
         if (retryCount > 0) {
             await new Promise(r => setTimeout(r, 1000));
             return this.startPlay(streamUrl, retryCount - 1);
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