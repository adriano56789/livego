import { Router } from 'express';
import { livekitController } from '../controllers/livekitController.js';
const router = Router();
// Token
router.post('/livekit/token/generate', livekitController.generateToken);
// Room
router.get('/livekit/rooms', livekitController.listRooms);
router.post('/livekit/room/create', livekitController.createRoom);
router.get('/livekit/room/:roomId', livekitController.getRoom);
router.delete('/livekit/room/:roomId', livekitController.deleteRoom);
// Participants
router.get('/livekit/room/:roomId/participants', livekitController.listParticipants);
router.get('/livekit/room/:roomId/participants/:participantId', livekitController.getParticipant);
router.post('/livekit/room/:roomId/participants/:participantId/remove', livekitController.removeParticipant);
router.post('/livekit/room/:roomId/participants/:participantId/mute', livekitController.muteParticipant);
router.post('/livekit/room/:roomId/participants/:participantId/unmute', livekitController.unmuteParticipant);
// Tracks
router.get('/livekit/tracks/:roomId', livekitController.listTracks);
router.post('/livekit/tracks/:roomId/:trackId/mute', livekitController.muteTrack);
router.post('/livekit/tracks/:roomId/:trackId/unmute', livekitController.unmuteTrack);
router.delete('/livekit/tracks/:roomId/:trackId', livekitController.removeTrack);
// Recording / Ingest
router.post('/livekit/record/:roomId/start', livekitController.startRecord);
router.post('/livekit/record/:roomId/stop', livekitController.stopRecord);
router.post('/livekit/ingest/:roomId', livekitController.ingest);
// Monitoring
router.get('/livekit/system/health', livekitController.health);
router.get('/livekit/system/info', livekitController.info);
router.get('/livekit/system/stats', livekitController.stats);
router.get('/livekit/system/logs', livekitController.logs);
router.get('/livekit/system/config', livekitController.getConfig);
router.put('/livekit/system/config', livekitController.updateConfig);
// Webhook
router.post('/livekit/webhook/register', livekitController.registerWebhook);
router.delete('/livekit/webhook/:id', livekitController.deleteWebhook);
export default router;
