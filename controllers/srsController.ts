
import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response.js';

const mockSrsData = {
    versions: { major: 5, minor: 0, revision: 135, version: "5.0.135" },
    summaries: { ok: true, self: { version: "5.0.135", pid: 1234 }, system: {} },
    streams: [{ id: 'str_abc123', name: 'livetest', clients: 5 }],
    clients: [{ id: 'cli_xyz789', stream: 'str_abc123', ip: '192.168.1.10', type: 'Play' }],
    metrics: {}
};

export const srsController = {
    getVersions: (req: Request, res: Response) => sendSuccess(res, mockSrsData.versions),
    getSummaries: (req: Request, res: Response) => sendSuccess(res, mockSrsData.summaries),
    getFeatures: (req: Request, res: Response) => sendSuccess(res, { srs_features: { webrtc: true } }),
    getClients: (req: Request, res: Response) => sendSuccess(res, { clients: mockSrsData.clients }),
    getClientById: (req: Request, res: Response) => sendSuccess(res, { client: mockSrsData.clients[0] }),
    getStreams: (req: Request, res: Response) => sendSuccess(res, { streams: mockSrsData.streams }),
    getStreamById: (req: Request, res: Response) => sendSuccess(res, { stream: mockSrsData.streams[0] }),
    deleteStreamById: (req: Request, res: Response) => sendSuccess(res, { code: 0 }),
    getConnections: (req: Request, res: Response) => sendSuccess(res, { conns: mockSrsData.clients }),
    getConnectionById: (req: Request, res: Response) => sendSuccess(res, { conn: mockSrsData.clients[0] }),
    deleteConnectionById: (req: Request, res: Response) => sendSuccess(res, { code: 0 }),
    getConfigs: (req: Request, res: Response) => sendSuccess(res, { config: "vhost __defaultVhost__ {}" }),
    updateConfigs: (req: Request, res: Response) => sendSuccess(res, { code: 0 }),
    getVhosts: (req: Request, res: Response) => sendSuccess(res, { vhosts: [{ name: '__defaultVhost__', enabled: true }] }),
    getVhostById: (req: Request, res: Response) => sendSuccess(res, { vhost: { name: '__defaultVhost__', enabled: true } }),
    getRequests: (req: Request, res: Response) => sendSuccess(res, { requests: [] }),
    getSessions: (req: Request, res: Response) => sendSuccess(res, { sessions: [] }),
    getMetrics: (req: Request, res: Response) => sendSuccess(res, mockSrsData.metrics),
    rtcPublish: (req: Request, res: Response) => {
        const { sdp, streamUrl } = req.body;
        if (!sdp || !streamUrl) return sendError(res, 'SDP and streamUrl are required.', 400);
        const sessionId = `rtc-session-${Date.now()}`;
        const mockSdpAnswer = `v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=LiveGo\r\nc=IN IP4 127.0.0.1\r\nt=0 0\r\nm=audio 9000 RTP/AVP 111\r\na=rtpmap:111 opus/48000/2\r\n`;
        sendSuccess(res, { code: 0, sdp: mockSdpAnswer, sessionid: sessionId });
    },
    trickleIce: (req: Request, res: Response) => {
        const { sessionId } = req.params;
        if (!req.body) return sendError(res, 'Candidate body is required.', 400);
        return sendSuccess(res, { code: 0 });
    }
};
