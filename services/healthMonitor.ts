
import { apiTrackerService } from './apiTrackerService';

export type ConnectivityStatus = 'connected' | 'disconnected' | 'reconnecting' | 'scanning';

export interface HealthIncident {
    time: string;
    status: ConnectivityStatus;
    latency: number;
    cause: string;
    details?: string;
    isViolation?: boolean;
}

export interface ApiStatus {
    name: string;
    endpoint: string;
    status: 'online' | 'offline' | 'error';
    lastError?: string;
}

type HealthListener = (status: ConnectivityStatus, latency: number, lastIncident?: HealthIncident) => void;

class HealthMonitorService {
    private status: ConnectivityStatus = 'connected';
    private latency: number = 0;
    private listeners: HealthListener[] = [];
    private checkInterval: ReturnType<typeof setInterval> | null = null;
    private incidents: HealthIncident[] = [];
    
    // NOVO: Estado específico para Perícia de APIs (Independente da VPS)
    public apiServices: ApiStatus[] = [
        { name: 'Gateway Principal', endpoint: '/status', status: 'online' },
        { name: 'Autenticação (Auth)', endpoint: '/auth/last-email', status: 'online' },
        { name: 'Banco de Dados (Data)', endpoint: '/gifts', status: 'online' },
        { name: 'Realtime (Socket)', endpoint: '/ws-handshake', status: 'online' }
    ];

    // Use the correct port where the frontend is running
    private readonly BASE_URL = 'http://localhost:5174/api';
    
    // Add request timeout (in milliseconds)
    private readonly REQUEST_TIMEOUT = 3000;

    constructor() {
        this.startMonitoring();
    }

    private async checkHealth() {
        if (this.status === 'scanning') return;

        const start = Date.now();
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

            console.log(`[HealthMonitor] Checking status at ${this.BASE_URL}/status`);
            const response = await fetch(`${this.BASE_URL}/status`, { 
                method: 'GET',
                signal: controller.signal,
                cache: 'no-store',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            clearTimeout(timeoutId);
            
            // Log the response for debugging
            console.log(`[HealthMonitor] Status: ${response.status} ${response.statusText}`);

            if (response.ok) {
                this.latency = Date.now() - start;
                this.updateStatus('connected', 'Sinal Estável');
            } else {
                throw new Error(`HTTP_${response.status}`);
            }
        } catch (err: any) {
            this.handleVpsFailure(err);
        }
    }

    private handleVpsFailure(err: any) {
        this.latency = -1;
        let cause = 'VPS_OFFLINE';
        if (err.name === 'AbortError') cause = 'TIMEOUT_REDE';
        this.updateStatus('disconnected', cause, 'A VPS não responde aos pings de integridade.');
    }

    // BOTÃO DE TESTE: ESCANEAMENTO DE PERÍCIA (Monitor 2)
    async runApiForensics(): Promise<ApiStatus[]> {
        console.log("%c[PERÍCIA] Iniciando escaneamento profundo de APIs...", "color: #00E676; font-weight: bold");
        
        for (let i = 0; i < this.apiServices.length; i++) {
            const service = this.apiServices[i];
            const start = Date.now();
            
            try {
                const res = await fetch(`${this.BASE_URL}${service.endpoint}`, { 
                    method: 'GET', 
                    signal: AbortSignal.timeout(3000) 
                });

                this.apiServices[i] = {
                    ...service,
                    status: res.ok ? 'online' : 'error',
                    lastError: res.ok ? undefined : `Erro HTTP ${res.status}`
                };
            } catch (e: any) {
                let errorMsg = 'Desconectado';
                if (e.message.includes('fetch')) errorMsg = 'Violação de CORS ou Bloqueio de IP';
                if (e.name === 'AbortError') errorMsg = 'Instabilidade (Timeout)';

                this.apiServices[i] = {
                    ...service,
                    status: 'offline',
                    lastError: errorMsg
                };
            }
        }

        this.notify(this.incidents[0]); // Atualiza UI
        return this.apiServices;
    }

    private updateStatus(newStatus: ConnectivityStatus, cause: string, details?: string) {
        const isNew = this.status !== newStatus;
        this.status = newStatus;

        if (isNew && newStatus === 'disconnected') {
            const incident: HealthIncident = {
                time: new Date().toLocaleTimeString(),
                status: newStatus,
                latency: this.latency,
                cause,
                details
            };
            this.incidents.unshift(incident);
        }
        this.notify();
    }

    private async attemptAutoReconnect() {
        // Correção 'require is not defined' usando import dinâmico ESM
        try {
            const ws = await import('./websocket');
            const apiMod = await import('./api');
            const user = apiMod.storage.getUser();
            if (user?.id) ws.webSocketManager.connect(user.id);
        } catch (e) {}
    }

    startMonitoring() {
        if (this.checkInterval) return;
        this.checkHealth();
        this.checkInterval = setInterval(() => this.checkHealth(), 5000);
    }

    subscribe(listener: HealthListener) {
        this.listeners.push(listener);
        listener(this.status, this.latency);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify(incident?: HealthIncident) {
        this.listeners.forEach(l => l(this.status, this.latency, incident));
    }

    getStatus() { return this.status; }
    getHistory() { return this.incidents; }
}

export const healthMonitor = new HealthMonitorService();