import React, { useState } from 'react';
import { ChevronLeftIcon, PlayIcon, RefreshIcon } from '../icons';
import { api } from '../../services/api';
import { LoadingSpinner } from '../Loading';

const LiveKitMonitorScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [response, setResponse] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // States for inputs
    const [roomId, setRoomId] = useState('');
    const [participantId, setParticipantId] = useState('');
    const [userId, setUserId] = useState('');
    const [trackId, setTrackId] = useState('');
    const [webhookId, setWebhookId] = useState('');
    const [webhookUrl, setWebhookUrl] = useState('https://seu-dominio.com/webhook');
    const [configValue, setConfigValue] = useState('{"rtc": {"port": 7882}}');


    const handleApiCall = async (
        description: string,
        apiFunc: (...args: any[]) => Promise<any>,
        ...args: any[]
    ) => {
        setIsLoading(true);
        setResponse({ description, args });
        try {
            const res = await apiFunc(...args);
            setResponse((prev: any) => ({ ...prev, status: 'Success', data: res }));
        } catch (err: any) {
            setResponse((prev: any) => ({ ...prev, status: 'Error', data: err.message || 'Erro desconhecido' }));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClientSdkCall = (description: string, action: string) => {
        setIsLoading(true);
        setResponse({ description, args: [action] });
        setTimeout(() => {
            setResponse((prev: any) => ({...prev, status: 'Success', data: { simulated: true, action, message: `Ação do cliente '${action}' executada com sucesso.` }}));
            setIsLoading(false);
        }, 300);
    };

    const ApiButton: React.FC<{ title: string; onClick: () => void }> = ({ title, onClick }) => (
        <button 
            onClick={onClick}
            className="w-full bg-[#2C2C2E] p-3 rounded-lg text-white text-xs font-bold flex items-center gap-3 hover:bg-[#3A3A3C] transition-colors active:scale-95 disabled:opacity-50"
            disabled={isLoading}
        >
            <PlayIcon className="w-4 h-4 text-green-500" />
            <span>{title}</span>
        </button>
    );

    const Section: React.FC<{ title: string, children?: React.ReactNode }> = ({ title, children }) => (
        <div className="mb-6">
            <h3 className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-3">{title}</h3>
            <div className="space-y-2">{children}</div>
        </div>
    );
    
    const InputField: React.FC<{ label: string, value: string, onChange: (val: string) => void, isTextarea?: boolean }> = ({ label, value, onChange, isTextarea }) => (
         <div className="bg-[#2C2C2E] p-2 rounded-lg mb-2">
            <label className="text-gray-500 text-[8px] font-bold uppercase px-1">{label}</label>
            {isTextarea ? (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-transparent text-white text-xs outline-none px-1 h-16 resize-none"
                    disabled={isLoading}
                />
            ) : (
                <input 
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-transparent text-white text-xs outline-none px-1"
                    disabled={isLoading}
                />
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[160] bg-[#121212] flex flex-col font-sans animate-in slide-in-from-right duration-300">
            <header className="flex items-center p-4 border-b border-white/5 shrink-0">
                <button onClick={onClose}><ChevronLeftIcon className="w-6 h-6 text-white" /></button>
                <div className="flex-1 text-center mr-6"><h1 className="text-lg font-bold text-white">Monitor LiveKit (WebRTC)</h1></div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <Section title="Autenticação">
                    <InputField label="User ID" value={userId} onChange={setUserId} />
                    <ApiButton title="Gerar Token" onClick={() => handleApiCall('Gerar Token', api.livekit.token.generate, userId, 'Nome Exemplo')} />
                </Section>
                
                <Section title="Salas">
                    <InputField label="Room ID" value={roomId} onChange={setRoomId} />
                    <ApiButton title="Criar Sala" onClick={() => handleApiCall('Criar Sala', api.livekit.room.create, roomId)} />
                    <ApiButton title="Listar Salas" onClick={() => handleApiCall('Listar Salas', api.livekit.room.list)} />
                    <ApiButton title="Obter Sala" onClick={() => handleApiCall('Obter Sala', api.livekit.room.get, roomId)} />
                    <ApiButton title="Entrar na Sala" onClick={() => handleApiCall('Entrar na Sala', api.livekit.room.join, roomId)} />
                    <ApiButton title="Sair da Sala" onClick={() => handleApiCall('Sair da Sala', api.livekit.room.leave, roomId)} />
                    <ApiButton title="Encerrar Sala" onClick={() => handleApiCall('Encerrar Sala', api.livekit.room.delete, roomId)} />
                </Section>

                <Section title="Participantes">
                    <InputField label="Participant ID" value={participantId} onChange={setParticipantId} />
                    <ApiButton title="Listar Participantes" onClick={() => handleApiCall('Listar Participantes', api.livekit.participants.list, roomId)} />
                    <ApiButton title="Obter Participante" onClick={() => handleApiCall('Obter Participante', api.livekit.participants.get, roomId, participantId)} />
                    <ApiButton title="Remover Participante" onClick={() => handleApiCall('Remover Participante', api.livekit.participants.remove, roomId, participantId)} />
                    <ApiButton title="Mutar Participante" onClick={() => handleApiCall('Mutar Participante', api.livekit.participants.mute, roomId, participantId)} />
                    <ApiButton title="Desmutar Participante" onClick={() => handleApiCall('Desmutar Participante', api.livekit.participants.unmute, roomId, participantId)} />
                </Section>

                <Section title="Tracks (Áudio/Vídeo/Data)">
                    <InputField label="Track ID" value={trackId} onChange={setTrackId} />
                    <ApiButton title="Listar Tracks da Sala" onClick={() => handleApiCall('Listar Tracks', api.livekit.tracks.list, roomId)} />
                    <ApiButton title="Mutar Track" onClick={() => handleApiCall('Mutar Track', api.livekit.tracks.mute, roomId, trackId)} />
                    <ApiButton title="Desmutar Track" onClick={() => handleApiCall('Desmutar Track', api.livekit.tracks.unmute, roomId, trackId)} />
                    <ApiButton title="Remover Track" onClick={() => handleApiCall('Remover Track', api.livekit.tracks.remove, roomId, trackId)} />
                </Section>
                
                <Section title="Gravação / Ingestão">
                    <ApiButton title="Iniciar Gravação" onClick={() => handleApiCall('Iniciar Gravação', api.livekit.record.start, roomId)} />
                    <ApiButton title="Parar Gravação" onClick={() => handleApiCall('Parar Gravação', api.livekit.record.stop, roomId)} />
                    <ApiButton title="Ingestão de Mídia Externa" onClick={() => handleApiCall('Ingestão de Mídia', api.livekit.ingest, roomId)} />
                </Section>

                <Section title="Monitoramento do Servidor">
                    <ApiButton title="Estatísticas da Sala" onClick={() => handleApiCall('Estatísticas da Sala', api.livekit.monitoring.stats, roomId)} />
                    <ApiButton title="Saúde do Sistema" onClick={() => handleApiCall('Saúde do Sistema', api.livekit.monitoring.health)} />
                    {/* FIX: Corrected api call to use api.srs.getMetrics as api.livekit.monitoring.metrics does not exist. */}
                    <ApiButton title="Métricas (Prometheus)" onClick={() => handleApiCall('Métricas', api.srs.getMetrics)} />
                    <ApiButton title="Informações do Servidor" onClick={() => handleApiCall('Informações', api.livekit.monitoring.info)} />
                    <ApiButton title="Consultar Logs" onClick={() => handleApiCall('Logs', api.livekit.monitoring.logs)} />
                    <ApiButton title="Configuração Atual" onClick={() => handleApiCall('Configuração Atual', api.livekit.monitoring.getConfig)} />
                    <InputField label="Config JSON" value={configValue} onChange={setConfigValue} isTextarea/>
                    <ApiButton title="Atualizar Configuração" onClick={() => handleApiCall('Atualizar Configuração', api.livekit.monitoring.updateConfig, configValue)} />
                </Section>

                 <Section title="Webhooks">
                    <InputField label="Webhook URL" value={webhookUrl} onChange={setWebhookUrl} />
                    <ApiButton title="Registrar Webhook" onClick={() => handleApiCall('Registrar Webhook', api.livekit.webhook.register, webhookUrl)} />
                    <InputField label="Webhook ID" value={webhookId} onChange={setWebhookId} />
                    <ApiButton title="Remover Webhook" onClick={() => handleApiCall('Remover Webhook', api.livekit.webhook.delete, webhookId)} />
                </Section>

                <Section title="Client SDK (Simulado)">
                    <ApiButton title="connect(url, token)" onClick={() => handleClientSdkCall('Conectar ao Servidor', 'connect')} />
                    <ApiButton title="disconnect()" onClick={() => handleClientSdkCall('Desconectar', 'disconnect')} />
                    <ApiButton title="room.on('participantConnected')" onClick={() => handleClientSdkCall('Ouvir Evento: Participante Conectado', 'onParticipantConnected')} />
                    <ApiButton title="publishTrack(camera)" onClick={() => handleClientSdkCall('Publicar Track de Vídeo', 'publishTrack')} />
                    <ApiButton title="unpublishTrack(camera)" onClick={() => handleClientSdkCall('Remover Track de Vídeo', 'unpublishTrack')} />
                    <ApiButton title="enableCamera() / disableCamera()" onClick={() => handleClientSdkCall('Ligar/Desligar Câmera', 'toggleCamera')} />
                    <ApiButton title="enableMicrophone() / disableMicrophone()" onClick={() => handleClientSdkCall('Ligar/Desligar Microfone', 'toggleMic')} />
                    <ApiButton title="publishData('hello')" onClick={() => handleClientSdkCall('Enviar Mensagem de Dados', 'publishData')} />
                </Section>
            </div>

            <div className="h-[35%] bg-[#0A0A0A] border-t border-white/10 shrink-0 flex flex-col">
                <div className="p-3 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-white font-bold text-sm">Resposta da API</h3>
                    {isLoading && <LoadingSpinner />}
                </div>
                <div className="flex-1 overflow-auto p-3 text-xs font-mono">
                    {response && (
                        <>
                            <p className="text-gray-500">// {response.description}</p>
                            <p className="text-gray-500">// Args: {JSON.stringify(response.args)}</p>
                            <pre className={`${response.status === 'Success' ? 'text-green-400' : 'text-red-400'} whitespace-pre-wrap`}>
                                {JSON.stringify(response.data, null, 2)}
                            </pre>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveKitMonitorScreen;