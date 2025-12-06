import React, { createContext, useContext, useEffect, useState } from 'react';
import { Room, RoomEvent, RemoteParticipant, RemoteTrack, RemoteTrackPublication, Track } from 'livekit-client';
import { livekitService } from '../services/livekit';

interface LiveKitContextType {
  room: Room | null;
  participants: RemoteParticipant[];
  isConnecting: boolean;
  error: Error | null;
  connectToRoom: (roomName: string, identity: string) => Promise<Room | null>;
  disconnectFromRoom: () => Promise<void>;
  startAudio: () => Promise<void>;
  stopAudio: () => Promise<void>;
  startVideo: () => Promise<void>;
  stopVideo: () => Promise<void>;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

const LiveKitContext = createContext<LiveKitContextType | undefined>(undefined);

export const LiveKitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);

  const connectToRoom = async (roomName: string, identity: string) => {
    try {
      setIsConnecting(true);
      setError(null);
      
      const connectedRoom = await livekitService.connectToRoom(roomName, identity);
      if (!connectedRoom) throw new Error('Failed to connect to room');
      
      // Set up room event listeners
      connectedRoom
        .on(RoomEvent.ParticipantConnected, handleParticipantConnected)
        .on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
        .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
        .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
        .on(RoomEvent.AudioPlaybackStatusChanged, handleAudioPlaybackStatusChanged);
      
      // Set initial state
      setRoom(connectedRoom);
      setParticipants(Array.from(connectedRoom.remoteParticipants.values()));
      setIsAudioEnabled(connectedRoom.localParticipant.isMicrophoneEnabled);
      setIsVideoEnabled(connectedRoom.localParticipant.isCameraEnabled);
      
      return connectedRoom;
    } catch (err) {
      console.error('Error connecting to room:', err);
      setError(err instanceof Error ? err : new Error('Failed to connect to room'));
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromRoom = async () => {
    if (room) {
      await livekitService.disconnect();
      setRoom(null);
      setParticipants([]);
      setIsAudioEnabled(false);
      setIsVideoEnabled(false);
    }
  };

  const startAudio = async () => {
    if (!room) return;
    try {
      await room.localParticipant.setMicrophoneEnabled(true);
      setIsAudioEnabled(true);
    } catch (err) {
      console.error('Error starting audio:', err);
      setError(err instanceof Error ? err : new Error('Failed to start audio'));
    }
  };

  const stopAudio = async () => {
    if (!room) return;
    try {
      await room.localParticipant.setMicrophoneEnabled(false);
      setIsAudioEnabled(false);
    } catch (err) {
      console.error('Error stopping audio:', err);
      setError(err instanceof Error ? err : new Error('Failed to stop audio'));
    }
  };

  const startVideo = async () => {
    if (!room) return;
    try {
      await room.localParticipant.setCameraEnabled(true);
      setIsVideoEnabled(true);
    } catch (err) {
      console.error('Error starting video:', err);
      setError(err instanceof Error ? err : new Error('Failed to start video'));
    }
  };

  const stopVideo = async () => {
    if (!room) return;
    try {
      await room.localParticipant.setCameraEnabled(false);
      setIsVideoEnabled(false);
    } catch (err) {
      console.error('Error stopping video:', err);
      setError(err instanceof Error ? err : new Error('Failed to stop video'));
    }
  };

  // Event handlers
  const handleParticipantConnected = (participant: RemoteParticipant) => {
    setParticipants(prev => [...prev, participant]);
  };

  const handleParticipantDisconnected = (participant: RemoteParticipant) => {
    setParticipants(prev => prev.filter(p => p.sid !== participant.sid));
  };

  const handleTrackSubscribed = (
    track: RemoteTrack,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) => {
    console.log('Track subscribed:', track.kind, 'from', participant.identity);
    // Handle track subscription (e.g., attach to DOM)
  };

  const handleTrackUnsubscribed = (
    track: RemoteTrack,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) => {
    console.log('Track unsubscribed:', track.kind, 'from', participant.identity);
    // Handle track unsubscription (e.g., remove from DOM)
  };

  const handleAudioPlaybackStatusChanged = (canPlay: boolean) => {
    console.log('Audio playback status changed:', canPlay ? 'can play' : 'cannot play');
    // Handle audio playback status change
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (room) {
        disconnectFromRoom();
      }
    };
  }, [room]);

  const value = {
    room,
    participants,
    isConnecting,
    error,
    connectToRoom,
    disconnectFromRoom,
    startAudio,
    stopAudio,
    startVideo,
    stopVideo,
    isAudioEnabled,
    isVideoEnabled,
  };

  return (
    <LiveKitContext.Provider value={value}>
      {children}
    </LiveKitContext.Provider>
  );
};

export const useLiveKit = (): LiveKitContextType => {
  const context = useContext(LiveKitContext);
  if (context === undefined) {
    throw new Error('useLiveKit must be used within a LiveKitProvider');
  }
  return context;
};
