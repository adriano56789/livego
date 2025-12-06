import { Room, RoomEvent, RemoteParticipant, RemoteTrack, RemoteTrackPublication, RoomOptions, VideoPresets, VideoCodec } from 'livekit-client';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://your-livekit-instance.livekit.cloud';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';

class LiveKitService {
  private room: Room | null = null;
  private roomService: RoomServiceClient;

  constructor() {
    this.roomService = new RoomServiceClient(
      LIVEKIT_URL,
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET
    );
  }

  async connectToRoom(roomName: string, identity: string) {
    try {
      // Create access token
      const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
        identity,
        name: identity,
      });
      
      at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
      });
      
      const token = await at.toJwt();
      
      // Create room options
      const roomOpts: RoomOptions = {
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          videoCodec: 'vp8',
          // Configurações adicionais podem ser adicionadas conforme necessário
        },
      };
      
      // Create and connect to room
      this.room = new Room(roomOpts);
      
      // Set up event listeners
      this.setupRoomListeners();
      
      // Connect to the room
      await this.room.connect(LIVEKIT_URL, token);
      
      console.log('Successfully connected to LiveKit room:', roomName);
      return this.room;
    } catch (error) {
      console.error('Error connecting to LiveKit room:', error);
      throw error;
    }
  }
  
  private setupRoomListeners() {
    if (!this.room) return;
    
    this.room
      .on(RoomEvent.TrackSubscribed, this.handleTrackSubscribed)
      .on(RoomEvent.TrackUnsubscribed, this.handleTrackUnsubscribed)
      .on(RoomEvent.ParticipantConnected, this.handleParticipantConnected)
      .on(RoomEvent.ParticipantDisconnected, this.handleParticipantDisconnected)
      .on(RoomEvent.Disconnected, this.handleDisconnected);
  }
  
  private handleTrackSubscribed = (
    track: RemoteTrack,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) => {
    console.log('Track subscribed:', track.kind, 'from', participant.identity);
    // Handle the subscribed track (e.g., attach to video element)
  };
  
  private handleTrackUnsubscribed = (
    track: RemoteTrack,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) => {
    console.log('Track unsubscribed:', track.kind, 'from', participant.identity);
    // Handle track unsubscription
  };
  
  private handleParticipantConnected = (participant: RemoteParticipant) => {
    console.log('Participant connected:', participant.identity);
    // Handle new participant
  };
  
  private handleParticipantDisconnected = (participant: RemoteParticipant) => {
    console.log('Participant disconnected:', participant.identity);
    // Handle participant disconnection
  };
  
  private handleDisconnected = () => {
    console.log('Disconnected from room');
    this.cleanup();
  };
  
  async disconnect() {
    if (this.room) {
      await this.room.disconnect();
      this.cleanup();
    }
  }
  
  private cleanup() {
    if (this.room) {
      // Remove all event listeners
      this.room
        .off(RoomEvent.TrackSubscribed, this.handleTrackSubscribed)
        .off(RoomEvent.TrackUnsubscribed, this.handleTrackUnsubscribed)
        .off(RoomEvent.ParticipantConnected, this.handleParticipantConnected)
        .off(RoomEvent.ParticipantDisconnected, this.handleParticipantDisconnected)
        .off(RoomEvent.Disconnected, this.handleDisconnected);
      
      this.room = null;
    }
  }
  
  // Room management
  async createRoom(roomName: string, emptyTimeout: number = 10 * 60) {
    return this.roomService.createRoom({
      name: roomName,
      emptyTimeout,
      maxParticipants: 50,
    });
  }
  
  async deleteRoom(roomName: string) {
    return this.roomService.deleteRoom(roomName);
  }
  
  async listRooms() {
    return this.roomService.listRooms();
  }
  
  async getRoom(roomName: string) {
    const rooms = await this.roomService.listRooms();
    return rooms.find(room => room.name === roomName);
  }
}

export const livekitService = new LiveKitService();
