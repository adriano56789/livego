// Tipos WebRTC para TypeScript
export interface RTCConfiguration {
  iceServers?: RTCIceServer[];
  iceCandidatePoolSize?: number;
  iceTransportPolicy?: 'all' | 'relay';
  bundlePolicy?: 'max-bundle' | 'max-compat' | 'balanced';
  rtcpMuxPolicy?: 'require' | 'negotiate';
  certificates?: RTCCertificate[];
}

export interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
  credentialType?: 'password' | 'oauth';
}

export interface RTCPeerConnection {
  addTrack(track: MediaStreamTrack, ...streams: MediaStream[]): RTCRtpSender;
  removeTrack(sender: RTCRtpSender): void;
  getSenders(): RTCRtpSender[];
  getReceivers(): RTCRtpReceiver[];
  getTracks(): MediaStreamTrack[];
  createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescription>;
  createAnswer(options?: RTCAnswerOptions): Promise<RTCSessionDescription>;
  setLocalDescription(description: RTCSessionDescription): Promise<void>;
  setRemoteDescription(description: RTCSessionDescription): Promise<void>;
  getLocalDescription(): RTCSessionDescription | null;
  getRemoteDescription(): RTCSessionDescription | null;
  addIceCandidate(candidate: RTCIceCandidate): Promise<void>;
  getConfiguration(): RTCConfiguration;
  setConfiguration(configuration: RTCConfiguration): void;
  restartIce(): void;
  close(): void;
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  iceGatheringState: RTCIceGatheringState;
  signalingState: RTCSignalingState;
  ontrack: ((event: RTCTrackEvent) => void) | null;
  onicecandidate: ((event: RTCPeerConnectionIceEvent) => void) | null;
  onconnectionstatechange: ((event: Event) => void) | null;
  oniceconnectionstatechange: ((event: Event) => void) | null;
  onsignalingstatechange: ((event: Event) => void) | null;
}

export interface RTCSessionDescription {
  type: RTCSdpType;
  sdp: string;
}

export interface RTCPeerConnectionIceEvent {
  candidate: RTCIceCandidate;
}

export interface RTCTrackEvent {
  track: MediaStreamTrack;
  streams: MediaStream[];
  receiver: RTCRtpReceiver;
  transceiver: RTCRtpTransceiver;
}

export interface RTCRtpSender {
  track: MediaStreamTrack | null;
  replaceTrack(track: MediaStreamTrack | null): Promise<MediaStreamTrack | null>;
  setParameters(parameters: RTCRtpSendParameters): Promise<void>;
  getParameters(): RTCRtpSendParameters;
}

export interface RTCRtpReceiver {
  track: MediaStreamTrack | null;
  getParameters(): RTCRtpReceiveParameters;
}

export interface RTCRtpTransceiver {
  sender: RTCRtpSender;
  receiver: RTCRtpReceiver;
  direction: RTCRtpTransceiverDirection;
  currentDirection: RTCRtpTransceiverDirection | null;
  stop(): void;
}

export type RTCPeerConnectionState = 
  | 'new'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'closed';

export type RTCIceConnectionState = 
  | 'new'
  | 'checking'
  | 'connected'
  | 'completed'
  | 'failed'
  | 'disconnected'
  | 'closed';

export type RTCIceGatheringState = 
  | 'new'
  | 'gathering'
  | 'complete';

export type RTCSignalingState = 
  | 'stable'
  | 'have-local-offer'
  | 'have-remote-offer'
  | 'have-local-pranswer'
  | 'have-remote-pranswer'
  | 'have-local-offer'
  | 'closed';

export type RTCSdpType = 'offer' | 'answer' | 'pranswer' | 'rollback';

export type RTCRtpTransceiverDirection = 
  | 'sendrecv'
  | 'sendonly'
  | 'recvonly'
  | 'inactive'
  | 'stopped';

export interface RTCOfferOptions {
  offerToReceiveAudio?: boolean;
  offerToReceiveVideo?: boolean;
  voiceActivityDetection?: boolean;
  iceRestart?: boolean;
}

export interface RTCAnswerOptions {
  voiceActivityDetection?: boolean;
}

export interface RTCRtpSendParameters {
  encodings?: RTCRtpEncodingParameters[];
  codecs?: RTCRtpCodecParameters[];
  headerExtensions?: RTCRtpHeaderExtensionParameters[];
  rtcp?: RTCRtcpParameters;
  degradationPreference?: 'maintain-framerate' | 'maintain-resolution' | 'balanced';
}

export interface RTCRtpReceiveParameters {
  encodings?: RTCRtpEncodingParameters[];
  codecs?: RTCRtpCodecParameters[];
  headerExtensions?: RTCRtpHeaderExtensionParameters[];
  rtcp?: RTCRtcpParameters;
}

export interface RTCRtpEncodingParameters {
  ssrc?: number;
  rid?: string;
  codecPayloadType?: number;
  scaleResolutionDownBy?: number;
  maxBitrate?: number;
  maxFramerate?: number;
  priority?: number;
  networkPriority?: 'low' | 'medium' | 'high';
}

export interface RTCRtpCodecParameters {
  payloadType?: number;
  mimeType?: string;
  clockRate?: number;
  channels?: number;
  sdpFmtpLine?: string;
}

export interface RTCRtpHeaderExtensionParameters {
  uri?: string;
  id?: number;
  encrypted?: boolean;
  direction?: 'send' | 'recv' | 'sendrecv';
}

export interface RTCRtcpParameters {
  cname?: string;
  reducedSize?: boolean;
  mux?: boolean;
}

export interface RTCIceCandidate {
  candidate: string;
  sdpMid?: string;
  sdpMLineIndex?: number;
  foundation?: string;
  component?: number;
  priority?: number;
  ip?: string;
  protocol?: string;
  port?: number;
  type?: 'host' | 'srflx' | 'prflx' | 'relay';
  tcpType?: string;
  relatedAddress?: string;
  relatedPort?: number;
}

// Declarar global para TypeScript
declare global {
  interface RTCPeerConnection {
    new (configuration?: RTCConfiguration): RTCPeerConnection;
  }
  
  interface RTCSessionDescription {
    new (descriptionInitDict: RTCSessionDescriptionInit): RTCSessionDescription;
  }
  
  interface RTCIceCandidate {
    new (candidateInitDict: RTCIceCandidateInit): RTCIceCandidate;
  }
}

export interface RTCSessionDescriptionInit {
  type?: RTCSdpType;
  sdp?: string;
}

export interface RTCIceCandidateInit {
  candidate?: string;
  sdpMid?: string;
  sdpMLineIndex?: number;
  usernameFragment?: string;
}
