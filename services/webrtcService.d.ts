export declare class WebRTCService {
    private pc: RTCPeerConnection | null;
    private localStream: MediaStream | null;
    private remoteStream: MediaStream | null;
    private state: WebRTCState;
    private statsInterval: any;
    private currentStreamUrl: string | null;
    private currentStreamId: string | null;
    private readonly iceConfig: RTCIceServer[];

    constructor();

    // Public methods
    public startPublish(streamId: string, streamKey: string, retryCount?: number): Promise<MediaStream>;
    public startPlay(streamId: string, retryCount?: number): Promise<MediaStream>;
    public getLocalStream(): MediaStream | null;
    public getRemoteStream(): MediaStream | null;
    public getState(): WebRTCState;
    public getCurrentStreamId(): string | null;
    public stop(): void;
}

export declare type WebRTCState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

export declare const webRTCService: WebRTCService;
