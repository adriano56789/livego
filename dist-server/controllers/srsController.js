import { sendSuccess, sendError } from '../utils/response.js';
const mockSrsData = {
    versions: { major: 5, minor: 0, revision: 135, version: "5.0.135" },
    summaries: { ok: true, self: { version: "5.0.135", pid: 1234 }, system: {} },
    streams: [{ id: 'str_abc123', name: 'livetest', clients: 5 }],
    clients: [{ id: 'cli_xyz789', stream: 'str_abc123', ip: '192.168.1.10', type: 'Play' }],
    metrics: {}
};
export const srsController = {
    getVersions: (req, res) => sendSuccess(res, mockSrsData.versions),
    getSummaries: (req, res) => sendSuccess(res, mockSrsData.summaries),
    getFeatures: (req, res) => sendSuccess(res, { srs_features: { webrtc: true } }),
    getClients: (req, res) => sendSuccess(res, { clients: mockSrsData.clients }),
    getClientById: (req, res) => sendSuccess(res, { client: mockSrsData.clients[0] }),
    getStreams: (req, res) => sendSuccess(res, { streams: mockSrsData.streams }),
    getStreamById: (req, res) => sendSuccess(res, { stream: mockSrsData.streams[0] }),
    deleteStreamById: (req, res) => sendSuccess(res, { code: 0 }),
    getConnections: (req, res) => sendSuccess(res, { conns: mockSrsData.clients }),
    getConnectionById: (req, res) => sendSuccess(res, { conn: mockSrsData.clients[0] }),
    deleteConnectionById: (req, res) => sendSuccess(res, { code: 0 }),
    getConfigs: (req, res) => sendSuccess(res, { config: "vhost __defaultVhost__ {}" }),
    updateConfigs: (req, res) => sendSuccess(res, { code: 0 }),
    getVhosts: (req, res) => sendSuccess(res, { vhosts: [{ name: '__defaultVhost__', enabled: true }] }),
    getVhostById: (req, res) => sendSuccess(res, { vhost: { name: '__defaultVhost__', enabled: true } }),
    getRequests: (req, res) => sendSuccess(res, { requests: [] }),
    getSessions: (req, res) => sendSuccess(res, { sessions: [] }),
    getMetrics: (req, res) => sendSuccess(res, mockSrsData.metrics),
    rtcPublish: (req, res) => {
        const { sdp, streamUrl } = req.body;
        if (!sdp || !streamUrl)
            return sendError(res, 'SDP and streamUrl are required.', 400);
        const sessionId = `rtc-session-${Date.now()}`;
        const mockSdpAnswer = `v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=LiveGo\r\nc=IN IP4 127.0.0.1\r\nt=0 0\r\nm=audio 9000 RTP/AVP 111\r\na=rtpmap:111 opus/48000/2\r\n`;
        sendSuccess(res, { code: 0, sdp: mockSdpAnswer, sessionid: sessionId });
    },
    trickleIce: (req, res) => {
        const { sessionId } = req.params;
        if (!req.body)
            return sendError(res, 'Candidate body is required.', 400);
        return sendSuccess(res, { code: 0 });
    }
};
