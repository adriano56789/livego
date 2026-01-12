import React, { useState, useRef, useEffect, useCallback } from 'react';
// FIX: Corrected icon imports. RefreshCwIcon is exported as RefreshIcon. RadioIcon is exported as LiveIndicatorIcon. VideoIcon and DownloadIcon are now available.
import { ChevronLeftIcon, PlayIcon, RefreshIcon, MicIcon, MicOffIcon, VideoIcon, LiveIndicatorIcon, DownloadIcon, SlidersIcon } from './icons';
import { ToastType } from '../types';
import { api } from '../services/api';

// FIX: Made `children` prop optional to resolve type errors.
const ControlButton = ({ onClick, children, className = '' }: { onClick?: () => void, children?: React.ReactNode, className?: string }) => (
    <button onClick={onClick} className={`w-full bg-[#2C2C2E] p-3 rounded-lg text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#3A3A3C] transition-colors active:scale-95 disabled:opacity-50 ${className}`}>
        {children}
    </button>
);

// FIX: Made `children` prop optional to resolve type errors.
const SettingRow = ({ label, children }: { label: string, children?: React.ReactNode }) => (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
        <label className="text-gray-400 text-xs font-medium">{label}</label>
        {children}
    </div>
);

const Slider = ({ value, onChange, min, max, step }: { value: number, onChange: (v: number) => void, min: number, max: number, step: number }) => (
    <div className="flex items-center gap-2 w-40">
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
        <span className="text-white text-xs font-mono w-10 text-right">{value}</span>
    </div>
);

const Dropdown = ({ value, onChange, options }: { value: string, onChange: (v: string) => void, options: string[] }) => (
    <select value={value} onChange={e => onChange(e.target.value)} className="bg-[#2C2C2E] text-white text-xs rounded px-2 py-1 border border-transparent focus:border-purple-500 outline-none">
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
);


const StreamingControlPanel: React.FC<{ onClose: () => void, addToast: (type: ToastType, message: string) => void }> = ({ onClose, addToast }) => {
    const [logs, setLogs] = useState<string[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);

    // Settings
    const [serverUrl, setServerUrl] = useState('rtmp://72.60.249.175/live/stream-key');
    const [protocol, setProtocol] = useState('RTMP');
    const [videoSource, setVideoSource] = useState('camera_front');
    const [resolution, setResolution] = useState('720p');
    const [videoBitrate, setVideoBitrate] = useState(2500);
    const [fps, setFps] = useState(30);
    const [videoCodec, setVideoCodec] = useState('H.264');
    const [audioBitrate, setAudioBitrate] = useState(128);
    const [audioCodec, setAudioCodec] = useState('AAC');

    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    const addLog = useCallback((message: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev].slice(0, 100));
    }, []);

    const cleanupStream = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    const getStream = useCallback(async () => {
        cleanupStream();
        try {
            let mediaStream: MediaStream;
            if (videoSource.startsWith('camera')) {
                const facingMode = videoSource === 'camera_front' ? 'user' : 'environment';
                mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: true });
                addLog('Fonte da câmera ativada.');
            } else if (videoSource === 'screen') {
                mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                addLog('Captura de tela ativada.');
            } else {
                addLog('Fonte de arquivo não implementada (simulação).');
                return;
            }
            setStream(mediaStream);
        } catch (err) {
            addLog(`ERRO: Falha ao acessar a fonte de mídia. (${(err as Error).message})`);
        }
    }, [videoSource, addLog, cleanupStream]);

    useEffect(() => {
        getStream();
        return cleanupStream;
    }, [videoSource, getStream]);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const handleStartStream = async () => {
        if (!stream) {
            addLog("ERRO: Nenhuma fonte de mídia selecionada para transmitir.");
            return;
        }
        setIsStreaming(true);
        addLog(`Iniciando transmissão para ${serverUrl} via ${protocol}`);
        addLog(`Configurações: ${resolution} @ ${fps}fps, ${videoBitrate}kbps ${videoCodec} / ${audioBitrate}kbps ${audioCodec}`);

        try {
            const pc = new RTCPeerConnection();
            peerConnectionRef.current = pc;
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            pc.onconnectionstatechange = () => {
                if(pc.connectionState === 'connected') {
                    addLog("Conexão WebRTC simulada estabelecida com o servidor.");
                } else if (pc.connectionState === 'failed') {
                    addLog("ERRO: Conexão WebRTC simulada falhou.");
                    setIsStreaming(false);
                }
            };
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            const response = await api.srs.rtcPublish(offer.sdp!, serverUrl);
            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: response.sdp }));
        } catch (error) {
            addLog(`ERRO ao simular conexão: ${(error as Error).message}`);
            setIsStreaming(false);
        }
    };
    
    const handleStopStream = () => {
        setIsStreaming(false);
        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;
        addLog("Transmissão encerrada.");
    };

    const handleToggleMute = () => {
        if (!stream) return;
        stream.getAudioTracks().forEach(track => {
            track.enabled = !track.enabled;
            setIsMuted(!track.enabled);
            addLog(`Microfone ${!track.enabled ? 'mutado' : 'desmutado'}.`);
        });
    };

    const handleSwitchCamera = () => {
        if (videoSource.startsWith('camera')) {
            setVideoSource(prev => prev === 'camera_front' ? 'camera_back' : 'camera_front');
        } else {
            addLog("A troca de câmera só está disponível com a fonte de câmera.");
        }
    };
    
    const handleToggleRecord = () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            addLog("Gravação parada.");
        } else if (stream) {
            recordedChunksRef.current = [];
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            recorder.ondataavailable = e => {
                if (e.data.size > 0) recordedChunksRef.current.push(e.data);
            };
            recorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `livego-recording-${Date.now()}.webm`;
                a.click();
                URL.revokeObjectURL(url);
                addLog("Gravação salva no seu dispositivo.");
            };
            mediaRecorderRef.current = recorder;
            recorder.start();
            setIsRecording(true);
            addLog("Gravação local iniciada.");
        }
    };


    return (
        <div className="fixed inset-0 z-[160] bg-[#121212] flex flex-col font-sans animate-in slide-in-from-right duration-300">
            <header className="flex items-center p-4 border-b border-white/5 shrink-0">
                <button onClick={onClose}><ChevronLeftIcon className="w-6 h-6 text-white" /></button>
                <div className="flex-1 text-center mr-6"><h1 className="text-lg font-bold text-white">Painel de Streaming (SDK)</h1></div>
            </header>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                <div className="w-full md:w-2/3 p-4 flex flex-col">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-white/10 shadow-lg">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        {isStreaming && <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">LIVE</div>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                        <ControlButton onClick={isStreaming ? handleStopStream : handleStartStream} className={isStreaming ? 'bg-red-600' : 'bg-green-600'}>
                            {isStreaming ? <LiveIndicatorIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                            <span>{isStreaming ? 'Parar' : 'Iniciar'}</span>
                        </ControlButton>
                        <ControlButton onClick={handleToggleMute}>
                            {isMuted ? <MicOffIcon className="w-4 h-4"/> : <MicIcon className="w-4 h-4"/>}
                            <span>{isMuted ? 'Desmutar' : 'Mutar'}</span>
                        </ControlButton>
                         <ControlButton onClick={handleSwitchCamera}>
                            <RefreshIcon className="w-4 h-4"/>
                            <span>Câmera</span>
                        </ControlButton>
                        <ControlButton onClick={handleToggleRecord} className={isRecording ? 'bg-blue-600' : ''}>
                            <DownloadIcon className="w-4 h-4"/>
                            <span>{isRecording ? 'Parar Rec' : 'Gravar'}</span>
                        </ControlButton>
                    </div>
                </div>

                <div className="w-full md:w-1/3 p-4 border-t md:border-t-0 md:border-l border-white/5 overflow-y-auto no-scrollbar">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-gray-400 text-xs font-bold mb-2">Conexão</h3>
                            <div className="bg-[#1C1C1E] rounded-lg p-2 space-y-2">
                                <input type="text" value={serverUrl} onChange={e => setServerUrl(e.target.value)} className="w-full bg-[#2C2C2E] text-white text-xs p-2 rounded border border-transparent focus:border-purple-500 outline-none" />
                                <SettingRow label="Protocolo"><Dropdown value={protocol} onChange={setProtocol} options={['RTMP', 'RTSP', 'SRT', 'UDP']} /></SettingRow>
                            </div>
                        </div>

                         <div>
                            <h3 className="text-gray-400 text-xs font-bold mb-2">Fonte</h3>
                             <div className="bg-[#1C1C1E] rounded-lg p-2 space-y-2">
                                <SettingRow label="Fonte de Vídeo">
                                    <Dropdown value={videoSource} onChange={setVideoSource} options={['camera_front', 'camera_back', 'screen', 'file']} />
                                </SettingRow>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-gray-400 text-xs font-bold mb-2 flex items-center gap-2"><SlidersIcon className="w-3 h-3"/> Encoder</h3>
                            <div className="bg-[#1C1C1E] rounded-lg p-2 space-y-2">
                                <SettingRow label="Resolução"><Dropdown value={resolution} onChange={v => { setResolution(v); addLog(`Resolução alterada para ${v}.`); }} options={['1080p', '720p', '480p']} /></SettingRow>
                                <SettingRow label="Bitrate Vídeo"><Slider value={videoBitrate} onChange={v => { setVideoBitrate(v); addLog(`Bitrate de vídeo alterado para ${v}kbps.`); }} min={500} max={8000} step={100} /></SettingRow>
                                <SettingRow label="FPS"><Dropdown value={String(fps)} onChange={v => { setFps(Number(v)); addLog(`FPS alterado para ${v}.`); }} options={['15', '24', '30', '60']} /></SettingRow>
                                <SettingRow label="Codec Vídeo"><Dropdown value={videoCodec} onChange={v => { setVideoCodec(v); addLog(`Codec de vídeo alterado para ${v}.`); }} options={['H.264', 'H.265']} /></SettingRow>
                                <SettingRow label="Bitrate Áudio"><Slider value={audioBitrate} onChange={v => { setAudioBitrate(v); addLog(`Bitrate de áudio alterado para ${v}kbps.`); }} min={64} max={192} step={16} /></SettingRow>
                                <SettingRow label="Codec Áudio"><Dropdown value={audioCodec} onChange={v => { setAudioCodec(v); addLog(`Codec de áudio alterado para ${v}.`); }} options={['AAC', 'Opus']} /></SettingRow>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-[20%] bg-[#0A0A0A] border-t border-white/10 shrink-0 flex flex-col">
                <div className="p-2 border-b border-white/10"><h3 className="text-white font-bold text-xs px-1">LOG DE ATIVIDADE</h3></div>
                <div className="flex-1 overflow-auto p-2 text-xs font-mono space-y-1 flex flex-col-reverse">
                    {logs.map((log, i) => <div key={i} className={`whitespace-pre-wrap ${log.startsWith('ERRO') ? 'text-red-400' : 'text-gray-400'}`}>{log}</div>)}
                </div>
            </div>
        </div>
    );
};

export default StreamingControlPanel;