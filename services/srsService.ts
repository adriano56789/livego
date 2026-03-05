/**
 * SRS (Simple Realtime Server) Real Service
 * 
 * This service connects to a real SRS media server via HTTP API.
 * Replaces the mock implementation with actual WebRTC signaling.
 */
class SRSService {
  private readonly SRS_API_BASE = 'http://72.60.249.175:1985';

  constructor() {
    console.log('[SRSService] Initialized Real SRS Service');
  }

  /**
   * Sanitize SDP to remove incompatible attributes
   */
  private sanitizeSDP(sdp: string): string {
    const lines = sdp.replace(/\r\n/g, '\n').split('\n');
    const newLines: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '') continue;

      // Remove problematic attributes
      if (trimmed.includes('extmap-allow-mixed')) continue;
      if (trimmed.includes('transport-cc')) continue;
      if (trimmed.includes('goog-remb')) continue;

      newLines.push(trimmed);
    }

    return newLines.join('\r\n') + '\r\n';
  }

  /**
   * Handle Publish (Client sending video to SRS Server)
   */
  public async publish(streamUrl: string, offerSdp: string): Promise<{ code: number, sdp: string, sessionid: string }> {
    console.log(`[SRSService] PUBLISH Request for ${streamUrl}`);
    
    try {
      const response = await fetch(`${this.SRS_API_BASE}/rtc/v1/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamurl: streamUrl,
          sdp: offerSdp
        })
      });

      if (!response.ok) {
        throw new Error(`SRS API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[SRSService] PUBLISH Response:`, data);

      if (data.code === 0) {
        return {
          code: 0,
          sdp: this.sanitizeSDP(data.sdp),
          sessionid: data.sessionid
        };
      } else {
        throw new Error(`SRS Publish Failed: ${data.code}`);
      }

    } catch (error) {
      console.error('[SRSService] Publish Failed:', error);
      return { code: -1, sdp: '', sessionid: '' };
    }
  }

  /**
   * Handle Play (Client requesting video from SRS Server)
   */
  public async play(streamUrl: string, offerSdp: string): Promise<{ code: number, sdp: string, sessionid: string }> {
    console.log(`[SRSService] PLAY Request for ${streamUrl}`);
    
    try {
      const response = await fetch(`${this.SRS_API_BASE}/rtc/v1/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamurl: streamUrl,
          sdp: offerSdp
        })
      });

      if (!response.ok) {
        throw new Error(`SRS API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[SRSService] PLAY Response:`, data);

      if (data.code === 0) {
        return {
          code: 0,
          sdp: this.sanitizeSDP(data.sdp),
          sessionid: data.sessionid
        };
      } else {
        throw new Error(`SRS Play Failed: ${data.code}`);
      }

    } catch (error) {
      console.error('[SRSService] Play Failed:', error);
      return { code: -1, sdp: '', sessionid: '' };
    }
  }

  /**
   * Stop a session by ID
   */
  public async stop(sessionId: string): Promise<{ code: number, desc: string }> {
    console.log(`[SRSService] Stopping session ${sessionId}`);
    
    try {
      const response = await fetch(`${this.SRS_API_BASE}/rtc/v1/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionid: sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`SRS API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        code: data.code || 0,
        desc: data.desc || "Session stopped"
      };

    } catch (error) {
      console.error('[SRSService] Stop Failed:', error);
      return { code: -1, desc: "Failed to stop session" };
    }
  }

  /**
   * Get stream statistics from SRS
   */
  public async getStreamStats(streamId: string) {
    try {
      const response = await fetch(`${this.SRS_API_BASE}/api/v1/streams/${streamId}`);
      
      if (!response.ok) {
        throw new Error(`SRS API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('[SRSService] Get Stats Failed:', error);
      return {
        id: streamId,
        clients: 0,
        kbps: { recv_30s: 0, send_30s: 0 },
        create: new Date().toISOString()
      };
    }
  }
}

export const srsService = new SRSService();
