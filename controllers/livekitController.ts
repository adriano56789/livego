import { Request, Response, NextFunction } from 'express';
// FIX: Import Buffer to resolve 'Cannot find name' error.
import { Buffer } from 'buffer';
import { sendSuccess } from '../utils/response.js';

const genericLiveKitSuccess = (req: Request, res: Response, next: NextFunction) => {
    try {
        const action = req.path.split('/').pop();
        return sendSuccess(res, { simulated: true, action, args: req.body || req.params }, `Ação LiveKit simulada '${action}' executada.`);
    } catch (error) {
        next(error);
    }
};

const listRooms = (req: Request, res: Response, next: NextFunction) => {
    try {
        const mockRooms = [
            { sid: 'RM_j6Q3p9Z7a2N1', name: 'sala-de-testes-1', empty_timeout: 60, max_participants: 200, creation_time: Math.floor(Date.now() / 1000) - 3600, turn_password: '...', num_participants: 5, active_recording: false },
            { sid: 'RM_k9R8v7Y6b3M2', name: 'jogatina-privada', empty_timeout: 60, max_participants: 10, creation_time: Math.floor(Date.now() / 1000) - 7200, turn_password: '...', num_participants: 2, active_recording: true },
        ];
        return sendSuccess(res, { rooms: mockRooms });
    } catch (error) {
        next(error);
    }
};

const generateToken = (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, userName } = req.body;
        // This is a mock JWT structure. In a real app, you'd use a library to sign it.
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
        const payload = Buffer.from(JSON.stringify({ sub: userId, name: userName, iat: Math.floor(Date.now() / 1000) })).toString('base64');
        const mockToken = `${header}.${payload}.mock_signature_string_for_testing`;
        return sendSuccess(res, { token: mockToken });
    } catch (error) {
        next(error);
    }
};

export const livekitController = {
    // Token
    generateToken: generateToken,
    // Room
    listRooms: listRooms,
    createRoom: genericLiveKitSuccess,
    getRoom: genericLiveKitSuccess,
    deleteRoom: genericLiveKitSuccess,
    // Participants
    listParticipants: genericLiveKitSuccess,
    getParticipant: genericLiveKitSuccess,
    removeParticipant: genericLiveKitSuccess,
    muteParticipant: genericLiveKitSuccess,
    unmuteParticipant: genericLiveKitSuccess,
    // Tracks
    listTracks: genericLiveKitSuccess,
    muteTrack: genericLiveKitSuccess,
    unmuteTrack: genericLiveKitSuccess,
    removeTrack: genericLiveKitSuccess,
    // Recording / Ingest
    startRecord: genericLiveKitSuccess,
    stopRecord: genericLiveKitSuccess,
    ingest: genericLiveKitSuccess,
    // Monitoring
    health: genericLiveKitSuccess,
    info: genericLiveKitSuccess,
    stats: genericLiveKitSuccess,
    logs: genericLiveKitSuccess,
    getConfig: genericLiveKitSuccess,
    updateConfig: genericLiveKitSuccess,
    // Webhook
    registerWebhook: genericLiveKitSuccess,
    deleteWebhook: genericLiveKitSuccess,
};