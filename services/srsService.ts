
import { db } from './database';

/**
 * SRS (Simple Realtime Server) Mock Service
 * 
 * This service simulates the behavior of a WebRTC Media Server.
 * Since we are running in a browser-only environment (simulation), we cannot use a real C++ SRS binary.
 * Instead, we use the browser's own RTCPeerConnection API to act as the "Server Side" peer.
 */
class SRSService {
  // Keep track of server-side peers to maintain connections in memory
  private serverPeers: Map<string, RTCPeerConnection> = new Map();

  constructor() {
    console.log('[SRSService] Initialized Media Server Mock');
  }

  /**
   * Helper to create a "Server-Side" Peer Connection
   */
  private createServerPeer(): RTCPeerConnection {
    // CRITICAL FIX: Force Unified Plan
    const config = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        sdpSemantics: 'unified-plan'
    } as RTCConfiguration;
    
    const pc = new RTCPeerConnection(config);

    // Debugging logs for the "Server" side
    pc.oniceconnectionstatechange = () => console.log(`[SRS-ServerPC] ICE State: ${pc.iceConnectionState}`);
    pc.onsignalingstatechange = () => console.log(`[SRS-ServerPC] Signaling State: ${pc.signalingState}`);
    
    pc.ontrack = (event) => {
        console.log(`[SRS-ServerPC] Track received: ${event.track.kind}`);
    };

    return pc;
  }

  /**
   * Waits for ICE gathering to complete or timeout.
   * This ensures the SDP returned contains candidates (Monolithic SDP), mimicking SRS behavior.
   */
  private async waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
    if (pc.iceGatheringState === 'complete') {
        return;
    }
    return new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
            resolve();
        }, 500); // Wait 500ms for candidates max, then proceed (SRS is fast)

        const checkState = () => {
            if (pc.iceGatheringState === 'complete') {
                pc.removeEventListener('icegatheringstatechange', checkState);
                clearTimeout(timeout);
                resolve();
            }
        };
        pc.addEventListener('icegatheringstatechange', checkState);
    });
  }

  /**
   * Injects simulated ICE candidates and SANITIZES the SDP.
   * Removes attributes that cause browser interoperability failures (extmap-allow-mixed, transport-cc).
   */
  private injectSimulatedCandidates(sdp: string): string {
      // 1. Normalize line endings
      const lines = sdp.replace(/\r\n/g, '\n').split('\n');
      const newLines: string[] = [];
      
      // 2. Filter incompatible lines (Sanitization)
      for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === '') continue;

          // REMOVE: extmap-allow-mixed (Major cause of "failed" state in Chrome >= 89)
          if (trimmed.includes('extmap-allow-mixed')) continue;
          
          // REMOVE: transport-cc (Congestion control often breaks in mocks if not handled perfectly)
          if (trimmed.includes('transport-cc')) continue;

          // REMOVE: goog-remb (Deprecated Google Bandwidth management)
          if (trimmed.includes('goog-remb')) continue;

          newLines.push(trimmed);
      }

      // 3. Mock IPs representing the ACTUAL server setup
      // Format: a=candidate:{foundation} {component} {protocol} {priority} {ip} {port} typ {type} ...
      const candidates = [
          // Public IP Candidate (SRFLX/HOST depending on NAT)
          `a=candidate:1 1 UDP 2122260223 72.60.249.175 50000 typ host`, 
          // Local LAN Candidate (Mock)
          `a=candidate:2 1 UDP 2122194687 192.168.0.105 50001 typ host`
      ];

      // 4. Join with strict CRLF (\r\n) as required by SDP spec
      return newLines.join('\r\n') + '\r\n' + candidates.join('\r\n') + '\r\n';
  }

  /**
   * Handle Publish (Client sending video to Server)
   */
  public async publish(streamUrl: string, offerSdp: string): Promise<{ code: number, sdp: string, sessionid: string }> {
      console.log(`[SRSService] PUBLISH Request for ${streamUrl}`);
      const streamId = streamUrl.split('/').pop() || 'unknown';

      // Clean up existing session if any
      this.stop(streamId);

      try {
          const serverPC = this.createServerPeer();
          this.serverPeers.set(streamId, serverPC);

          // 1. Set Remote Description (Client's Offer)
          await serverPC.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: offerSdp }));

          // 2. Create Answer
          const answer = await serverPC.createAnswer();
          
          // 3. Set Local Description (Triggers ICE gathering on Server side)
          await serverPC.setLocalDescription(answer);

          // 4. Wait for ICE candidates to be included in the SDP
          await this.waitForIceGathering(serverPC);

          console.log(`[SRSService] PUBLISH Answer generated.`);
          
          // 5. Inject Simulated IPs and Format SDP
          let finalSdp = serverPC.localDescription?.sdp || '';
          finalSdp = this.injectSimulatedCandidates(finalSdp);

          return {
              code: 0,
              sdp: finalSdp,
              sessionid: `srs-pub-${Date.now()}`
          };

      } catch (error) {
          console.error('[SRSService] Publish Failed:', error);
          return { code: -1, sdp: '', sessionid: '' };
      }
  }

  /**
   * Handle Play (Client requesting video from Server)
   */
  public async play(streamUrl: string, offerSdp: string): Promise<{ code: number, sdp: string, sessionid: string }> {
      console.log(`[SRSService] PLAY Request for ${streamUrl}`);
      const streamId = streamUrl.split('/').pop() || 'unknown';
      
      try {
          const serverPC = this.createServerPeer();
          // For playback, we generate a unique session ID but simulate connecting to the stream ID
          const playerId = `${streamId}-play-${Date.now()}`;
          this.serverPeers.set(playerId, serverPC);
          
          // 1. Set Remote Description (Client's Offer)
          await serverPC.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: offerSdp }));

          // 2. Create Answer
          const answer = await serverPC.createAnswer();

          // 3. Set Local Description
          await serverPC.setLocalDescription(answer);

          // 4. Wait for ICE
          await this.waitForIceGathering(serverPC);

          console.log(`[SRSService] PLAY Answer generated.`);
          
          // 5. Inject Simulated IPs and Format SDP
          let finalSdp = serverPC.localDescription?.sdp || '';
          finalSdp = this.injectSimulatedCandidates(finalSdp);

          return {
              code: 0,
              sdp: finalSdp,
              sessionid: playerId
          };

      } catch (error) {
           console.error('[SRSService] Play Failed:', error);
           return { code: -1, sdp: '', sessionid: '' };
      }
  }

  /**
   * Stop a session by ID or Stream URL
   */
  public stop(id: string) {
      // Logic to find and close peer connection
      if (this.serverPeers.has(id)) {
          console.log(`[SRSService] Stopping session for ${id}`);
          const pc = this.serverPeers.get(id);
          pc?.close();
          this.serverPeers.delete(id);
          return { code: 0, desc: "Session stopped" };
      }
      return { code: 0, desc: "Session not found or already stopped" };
  }

  public getStreamStats(streamId: string) {
      // Mock stats
      return {
          id: streamId,
          clients: Math.floor(Math.random() * 50) + 1,
          kbps: {
              recv_30s: Math.floor(Math.random() * 1000) + 500,
              send_30s: Math.floor(Math.random() * 1000) + 500
          },
          create: new Date().toISOString()
      };
  }
}

export const srsService = new SRSService();
