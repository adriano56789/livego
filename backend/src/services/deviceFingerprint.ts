import crypto from 'crypto';

export interface DeviceFingerprint {
    userAgent: string;
    language: string;
    platform: string;
    screenResolution: string;
    timezone: string;
    canvasFingerprint: string;
    webglFingerprint: string;
    audioFingerprint: string;
    fonts: string[];
    plugins: string[];
    cookies: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
    indexedDb: boolean;
    hardwareConcurrency: number;
    deviceMemory: number;
    maxTouchPoints: number;
}

export class DeviceFingerprintService {
    private static generateHash(data: string): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    static generateFingerprint(fingerprint: Partial<DeviceFingerprint>): string {
        try {
            // Combinar os dados mais relevantes para fingerprint
            const fingerprintData = [
                fingerprint.userAgent || '',
                fingerprint.language || '',
                fingerprint.platform || '',
                fingerprint.screenResolution || '',
                fingerprint.timezone || '',
                fingerprint.canvasFingerprint || '',
                fingerprint.webglFingerprint || '',
                fingerprint.audioFingerprint || '',
                (fingerprint.fonts || []).sort().join(','),
                (fingerprint.plugins || []).sort().join(','),
                fingerprint.cookies ? '1' : '0',
                fingerprint.localStorage ? '1' : '0',
                fingerprint.sessionStorage ? '1' : '0',
                fingerprint.indexedDb ? '1' : '0',
                fingerprint.hardwareConcurrency || 0,
                fingerprint.deviceMemory || 0,
                fingerprint.maxTouchPoints || 0
            ].join('|');

            return this.generateHash(fingerprintData);
        } catch (error: any) {
            console.error('❌ [FINGERPRINT] Erro ao gerar fingerprint:', error);
            // Fallback: usar apenas dados básicos
            const fallbackData = [
                fingerprint.userAgent || '',
                fingerprint.language || '',
                fingerprint.platform || ''
            ].join('|');
            
            return this.generateHash(fallbackData);
        }
    }

    static validateFingerprint(fingerprint: Partial<DeviceFingerprint>): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!fingerprint.userAgent || fingerprint.userAgent.length < 10) {
            errors.push('User Agent inválido ou muito curto');
        }

        if (!fingerprint.language || fingerprint.language.length < 2) {
            errors.push('Linguagem do navegador inválida');
        }

        if (!fingerprint.platform || fingerprint.platform.length < 2) {
            errors.push('Plataforma/SO inválido');
        }

        if (!fingerprint.screenResolution || fingerprint.screenResolution.length < 3) {
            errors.push('Resolução de tela inválida');
        }

        if (!fingerprint.timezone || fingerprint.timezone.length < 2) {
            errors.push('Timezone inválido');
        }

        // Verificar se há dados suficientes para fingerprint único
        const validFields = Object.keys(fingerprint).filter(key => 
            fingerprint[key as keyof DeviceFingerprint] !== undefined && 
            fingerprint[key as keyof DeviceFingerprint] !== ''
        );

        if (validFields.length < 5) {
            errors.push('Dados insuficientes para gerar fingerprint único');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    static detectSuspiciousPatterns(fingerprint: Partial<DeviceFingerprint>): { suspicious: boolean; reasons: string[] } {
        const reasons: string[] = [];

        // User Agent suspeito
        if (fingerprint.userAgent) {
            const suspiciousAgents = [
                /bot/i,
                /crawler/i,
                /spider/i,
                /scraper/i,
                /curl/i,
                /wget/i,
                /python/i,
                /java/i,
                /node/i
            ];

            for (const pattern of suspiciousAgents) {
                if (pattern.test(fingerprint.userAgent)) {
                    reasons.push('User Agent suspeito (bot/crawler)');
                    break;
                }
            }

            // User Agent muito curto ou genérico
            if (fingerprint.userAgent.length < 20) {
                reasons.push('User Agent muito curto ou genérico');
            }
        }

        // Sem plugins (muito incomum em browsers reais)
        if (fingerprint.plugins && Array.isArray(fingerprint.plugins)) {
            if (fingerprint.plugins.length === 0) {
                reasons.push('Nenhum plugin detectado (incomum)');
            }
        }

        // Canvas fingerprint inválido
        if (!fingerprint.canvasFingerprint || fingerprint.canvasFingerprint.length < 10) {
            reasons.push('Canvas fingerprint inválido ou ausente');
        }

        // WebGL fingerprint inválido
        if (!fingerprint.webglFingerprint || fingerprint.webglFingerprint.length < 10) {
            reasons.push('WebGL fingerprint inválido ou ausente');
        }

        // HardwareConcurrency suspeito
        if (fingerprint.hardwareConcurrency) {
            if (fingerprint.hardwareConcurrency > 64) {
                reasons.push('Número de cores suspeito (muito alto)');
            }
            if (fingerprint.hardwareConcurrency < 1) {
                reasons.push('Número de cores suspeito (muito baixo)');
            }
        }

        // DeviceMemory suspeito
        if (fingerprint.deviceMemory) {
            if (fingerprint.deviceMemory > 32) {
                reasons.push('Memória do dispositivo suspeita (muito alta)');
            }
            if (fingerprint.deviceMemory < 0.25) {
                reasons.push('Memória do dispositivo suspeita (muito baixa)');
            }
        }

        // Timezone inválido
        if (fingerprint.timezone) {
            const validTimezones = [
                /^UTC[+-]\d{1,2}$/,
                /^[A-Za-z_]+\/[A-Za-z_]+$/
            ];

            const isValidTimezone = validTimezones.some(pattern => pattern.test(fingerprint.timezone!));
            if (!isValidTimezone) {
                reasons.push('Timezone com formato inválido');
            }
        }

        return {
            suspicious: reasons.length > 0,
            reasons
        };
    }

    static getClientSideFingerprintCode(): string {
        return `
// Gerar Canvas Fingerprint
function getCanvasFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';
        
        canvas.width = 200;
        canvas.height = 50;
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('LiveGo Fingerprint', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('LiveGo Fingerprint', 4, 17);
        
        return canvas.toDataURL().slice(-50);
    } catch (e) {
        return '';
    }
}

// Gerar WebGL Fingerprint
function getWebGLFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        if (!gl) return '';
        
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (!debugInfo) return '';
        
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        
        return (vendor + renderer).slice(-50);
    } catch (e) {
        return '';
    }
}

// Gerar Audio Fingerprint
function getAudioFingerprint() {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return '';
        
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const analyser = context.createAnalyser();
        const gainNode = context.createGain();
        const scriptProcessor = context.createScriptProcessor(4096, 1, 1);
        
        oscillator.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.start(0);
        
        return new Promise((resolve) => {
            setTimeout(() => {
                oscillator.stop();
                context.close();
                resolve('audio_' + Date.now());
            }, 100);
        });
    } catch (e) {
        return Promise.resolve('');
    }
}

// Obter fontes disponíveis
function getFonts() {
    const fonts = [
        'Arial', 'Helvetica', 'Times New Roman', 'Times', 'Courier New', 'Courier',
        'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
        'Trebuchet MS', 'Arial Black', 'Impact'
    ];
    
    const detected = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return detected;
    
    const testText = 'mmmmmmmmmmlli';
    const testSize = '72px';
    
    fonts.forEach(font => {
        ctx.font = testSize + ' monospace';
        const baselineWidth = ctx.measureText(testText).width;
        
        ctx.font = testSize + ' ' + font + ', monospace';
        const testWidth = ctx.measureText(testText).width;
        
        if (testWidth !== baselineWidth) {
            detected.push(font);
        }
    });
    
    return detected;
}

// Obter plugins
function getPlugins() {
    const plugins = [];
    for (let i = 0; i < navigator.plugins.length; i++) {
        const plugin = navigator.plugins[i];
        plugins.push(plugin.name);
    }
    return plugins;
}

// Gerar fingerprint completo
async function generateDeviceFingerprint() {
    const fingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: screen.width + 'x' + screen.height,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        canvasFingerprint: getCanvasFingerprint(),
        webglFingerprint: getWebGLFingerprint(),
        audioFingerprint: await getAudioFingerprint(),
        fonts: getFonts(),
        plugins: getPlugins(),
        cookies: navigator.cookieEnabled,
        localStorage: typeof Storage !== 'undefined' && !!window.localStorage,
        sessionStorage: typeof Storage !== 'undefined' && !!window.sessionStorage,
        indexedDb: typeof indexedDB !== 'undefined',
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
        deviceMemory: (navigator as any).deviceMemory || 0,
        maxTouchPoints: navigator.maxTouchPoints || 0
    };
    
    return fingerprint;
}

// Enviar fingerprint para o backend
async function sendFingerprintToBackend() {
    try {
        const fingerprint = await generateDeviceFingerprint();
        
        // Enviar para todas as requisições futuras via header
        const fingerprintHash = await crypto.subtle.digest('SHA-256', 
            new TextEncoder().encode(JSON.stringify(fingerprint))
        );
        const hashArray = Array.from(new Uint8Array(fingerprintHash));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        // Armazenar em memória para uso em requisições (não usar localStorage)
        let deviceFingerprint = hashHex;
        
        return hashHex;
    } catch (error) {
        console.error('Erro ao gerar fingerprint:', error);
        return '';
    }
}

// Gerar fingerprint ao carregar a página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sendFingerprintToBackend);
} else {
    sendFingerprintToBackend();
}
        `;
    }
}

export default DeviceFingerprintService;
