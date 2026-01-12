import React, { useState, useEffect } from 'react';
import { healthMonitor, ConnectivityStatus, HealthIncident, ApiStatus } from '../../services/healthMonitor';
import { ChevronLeftIcon, RefreshIcon, ZapIcon, InfoIcon, ShieldIcon, PlayIcon, GlobeIcon, ChevronDownIcon } from '../icons';
import { LoadingSpinner } from '../Loading';

const endpoints = {
  "API Principal (LiveGo)": {
    "Autenticação e Usuários": [
      "POST /auth/login", "POST /auth/register", "POST /auth/logout",
      "GET /users/me", "GET /users/:id", "GET /users/online",
      "GET /users/:id/fans", "GET /users/:id/friends", "GET /users/search",
      "POST /users/:id/follow", "GET /users/me/blocklist", "POST /users/me/blocklist/:userId",
      "POST /users/me/blocklist/:userId/unblock", "GET /users/:userId/following",
      "GET /users/:userId/visitors", "GET /users/me/history", "GET /users/me/reminders",
      "DELETE /users/me/reminders/:id",
    ],
    "Streams, Social e Interação": [
      "GET /live/:category", "POST /streams", "PATCH /streams/:id",
      "PATCH /streams/:id/quality", "GET /streams/:streamId/donors", "POST /streams/:streamId/invite",
      "POST /streams/:streamId/cohost/invite", "POST /streams/:r/kick", "POST /streams/:r/moderator",
      "GET /streams/beauty-settings", "POST /streams/beauty-settings", "POST /streams/beauty-settings/reset",
      "POST /live/toggle-mic", "POST /live/toggle-sound", "POST /live/toggle-autofollow",
      "POST /live/toggle-autoinvite", "POST /posts",
    ],
    "Carteira, Presentes e Ganhos": [
      "GET /gifts", "GET /gifts/gallery", "POST /gift", "GET /wallet/balance",
      "POST /users/:userId/purchase", "POST /wallet/confirm-purchase", "POST /wallet/cancel-purchase",
      "POST /earnings/withdraw/calculate", "POST /earnings/withdraw/request",
      "POST /earnings/withdraw/methods", "GET /users/me/withdrawal-history",
      "POST /users/me/billing-address", "POST /users/me/credit-card",
    ],
    "Administração": [
      "GET /admin/withdrawals", "POST /admin/withdrawals/request", "POST /admin/withdrawals/method",
    ],
    "Sistema e Miscelânea": [
      "GET /status", "GET /db/collections", "POST /db/setup", "GET /assets/frames",
      "GET /assets/music", "POST /translate",
    ],
  },
  "API de Streaming (SRS)": {
    "Core": [
      "GET /v1/versions", "GET /v1/summaries", "GET /v1/features",
      "GET /v1/clients", "GET /v1/clients/:id", "GET /v1/streams", "GET /v1/streams/:id",
      "DELETE /v1/streams/:id", "GET /v1/connections", "DELETE /v1/connections/:id",
      "GET /v1/configs", "PUT /v1/configs", "GET /v1/metrics",
    ],
    "WebRTC": [
      "POST /v1/rtc/publish", "POST /v1/rtc/trickle/:sessionId",
    ],
  },
  "API de WebRTC (LiveKit)": {
    "Gerenciamento": [
      "POST /livekit/token/generate", "GET /livekit/rooms", "GET /livekit/room/:roomId",
      "POST /livekit/room/create", "DELETE /livekit/room/:roomId",
      "GET /livekit/room/:roomId/participants", "POST /livekit/room/:roomId/participants/:participantId/remove",
      "POST /livekit/room/:roomId/participants/:participantId/mute",
      "POST /livekit/tracks/:roomId/:trackId/mute",
      "POST /livekit/record/:roomId/start", "POST /livekit/record/:roomId/stop",
    ],
    "Sistema": [
        "GET /livekit/system/health", "GET /livekit/system/info", "GET /livekit/system/stats",
        "GET /livekit/system/logs", "POST /livekit/webhook/register", "DELETE /livekit/webhook/:id",
    ]
  },
};

const EndpointListItem: React.FC<{ endpoint: string }> = ({ endpoint }) => {
    const [method, ...pathParts] = endpoint.split(' ');
    const path = pathParts.join(' ');
    const methodColor = method === 'GET' ? 'text-blue-400' : 
                        method.startsWith('POST') ? 'text-green-400' :
                        method.startsWith('DELETE') ? 'text-red-400' :
                        'text-orange-400';

    return (
        <div className="flex items-center gap-4 px-4 py-2.5 bg-black/20 rounded-lg">
            <span className={`w-14 text-center font-mono text-xs font-bold ${methodColor}`}>{method}</span>
            <span className="text-gray-400 text-xs font-mono">{path}</span>
        </div>
    );
};

const CollapsibleSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-[#121212] rounded-2xl border border-white/5 overflow-hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4">
                <h4 className="text-white font-bold">{title}</h4>
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="p-4 pt-0">{children}</div>}
        </div>
    );
};

export default function ApiHealthMonitorScreen({ onClose }: { onClose: () => void }) {
    const [status, setStatus] = useState<ConnectivityStatus>('connected');
    const [latency, setLatency] = useState(0);
    const [apiServices, setApiServices] = useState<ApiStatus[]>(healthMonitor.apiServices);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        const unsubscribe = healthMonitor.subscribe((s: ConnectivityStatus, l: number) => {
            setStatus(s);
            setLatency(l);
            setApiServices([...healthMonitor.apiServices]);
        });
        return unsubscribe;
    }, []);

    const handleRunPericia = async () => {
        setIsScanning(true);
        await healthMonitor.runApiForensics();
        setApiServices([...healthMonitor.apiServices]);
        setTimeout(() => setIsScanning(false), 800);
    };

    return (
        <div className="fixed inset-0 z-[160] bg-[#080808] flex flex-col font-sans animate-in slide-in-from-right duration-300 overflow-hidden">
            {/* Header Minimalista */}
            <header className="flex items-center justify-between p-6 shrink-0 bg-transparent">
                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full active:scale-90 transition-transform">
                    <ChevronLeftIcon className="w-6 h-6 text-white" />
                </button>
                <div className="text-center">
                    <h1 className="text-white font-black text-[10px] uppercase tracking-[0.4em] opacity-40">LiveGo Protocol</h1>
                    <div className="flex items-center justify-center gap-2 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${status === 'connected' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`}></div>
                        <span className="text-[11px] text-white font-black uppercase tracking-tighter">Guarda Ativo</span>
                    </div>
                </div>
                <button onClick={() => window.location.reload()} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full active:rotate-180 transition-transform duration-500">
                    <RefreshIcon className="w-5 h-5 text-gray-400" />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-32 px-6">
                
                {/* MONITOR 1: STATUS DA VPS (Original) */}
                <section className="mb-10">
                    <h3 className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-4 px-1">Infraestrutura VPS</h3>
                    <div className={`w-full py-10 rounded-[32px] flex flex-col items-center justify-center transition-all duration-500 ${status === 'connected' ? 'bg-green-500/5 border border-green-500/10' : 'bg-red-500/5 border border-red-500/10'}`}>
                        <div className="relative mb-6">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center relative z-10 ${status === 'connected' ? 'bg-green-500' : 'bg-red-500'} shadow-2xl shadow-black`}>
                                <ZapIcon className="w-8 h-8 text-white fill-white" />
                            </div>
                            {status === 'connected' && <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>}
                        </div>
                        <h2 className={`text-2xl font-black ${status === 'connected' ? 'text-green-400' : 'text-red-400'} uppercase tracking-tighter`}>
                            {status === 'connected' ? 'VPS ONLINE' : 'VPS DESLIGADA'}
                        </h2>
                        <div className="mt-2 px-4 py-1 rounded-full bg-white/5 border border-white/5">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Latência: {latency === -1 ? '--' : `${latency}ms`}</span>
                        </div>
                    </div>
                </section>

                {/* BOTÃO DE PERÍCIA - AÇÃO CENTRAL */}
                <div className="mb-10">
                    <button 
                        onClick={handleRunPericia}
                        disabled={isScanning}
                        className="w-full bg-white text-black font-black text-xs uppercase tracking-widest py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-white/5 disabled:opacity-50"
                    >
                        {isScanning ? <LoadingSpinner /> : <PlayIcon className="w-4 h-4 fill-current" />}
                        {isScanning ? 'Rastreando Falhas...' : 'Escanear Integridade das APIs'}
                    </button>
                    <p className="text-[9px] text-gray-600 text-center mt-3 font-medium px-4 leading-relaxed">
                        Este escaneamento verifica se as APIs estão se desconectando sozinhas por violações de rede ou instabilidade de rota.
                    </p>
                </div>

                {/* MONITOR 2: PERÍCIA DE APIs (O Novo Monitor) */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-gray-500 text-[9px] font-black uppercase tracking-widest">Perícia de Aplicação</h3>
                        <span className="text-[9px] text-purple-400 font-black uppercase tracking-widest">LiveGo Guard v2.5</span>
                    </div>

                    <div className="space-y-2">
                        {apiServices.map((api, idx) => (
                            <div key={idx} className="bg-[#121212] rounded-2xl p-4 flex items-center justify-between border border-white/5 hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${api.status === 'online' ? 'bg-green-500' : api.status === 'error' ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}></div>
                                    <div className="flex flex-col">
                                        <span className="text-white text-[13px] font-bold tracking-tight">{api.name}</span>
                                        <span className="text-gray-600 text-[10px] font-mono">{api.endpoint}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={`text-[10px] font-black uppercase ${api.status === 'online' ? 'text-green-500' : 'text-red-500'}`}>
                                        {api.status === 'online' ? 'Ativa' : 'Falha'}
                                    </span>
                                    {api.lastError && (
                                        <span className="text-[8px] text-gray-500 font-bold max-w-[120px] truncate text-right">{api.lastError}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Alerta de Violação seletiva */}
                    {apiServices.some(s => s.status === 'offline') && (
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 mt-6 animate-in zoom-in-95 duration-300">
                            <div className="flex items-center gap-3 text-orange-400 mb-1">
                                <ShieldIcon className="w-4 h-4" />
                                <span className="text-[11px] font-black uppercase">Diagnóstico de Violação</span>
                            </div>
                            <p className="text-[10px] text-gray-500 leading-relaxed">
                                Detectamos que alguns endpoints estão inacessíveis enquanto outros operam. Isso sugere um <b>bloqueio seletivo de firewall</b> ou instabilidade específica na camada de aplicação.
                            </p>
                        </div>
                    )}
                </section>

                {/* NOVO: Endpoints Monitorados */}
                <section className="space-y-4 mt-10">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-gray-500 text-[9px] font-black uppercase tracking-widest">Endpoints Monitorados</h3>
                    </div>
                    <div className="space-y-3">
                        {Object.entries(endpoints).map(([mainGroup, subGroups]) => (
                            <CollapsibleSection key={mainGroup} title={mainGroup}>
                                <div className="space-y-4">
                                    {Object.entries(subGroups).map(([subGroup, endpointList]) => (
                                        <div key={subGroup}>
                                            {subGroup && <h5 className="text-purple-400 text-xs font-bold mb-3">{subGroup}</h5>}
                                            <div className="space-y-2">
                                                {(endpointList as string[]).map(endpoint => <EndpointListItem key={endpoint} endpoint={endpoint} />)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleSection>
                        ))}
                    </div>
                </section>
            </div>

            {/* Footer Status */}
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none flex justify-center">
                <div className="flex items-center gap-2 opacity-30">
                    <GlobeIcon className="w-3 h-3 text-gray-500" />
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest font-mono">End-to-End Monitoring System</span>
                </div>
            </div>
        </div>
    );
}
