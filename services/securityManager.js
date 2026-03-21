// CLIENT-SIDE: Adicionar ao frontend para enviar fingerprint em todas as requisições

class SecurityManager {
    constructor() {
        this.fingerprint = null;
        this.init();
    }

    async init() {
        this.fingerprint = await this.generateFingerprint();
        this.setupAxiosInterceptor();
        this.setupEventListeners();
    }

    async generateFingerprint() {
        try {
            // Gerar Canvas Fingerprint
            const getCanvasFingerprint = () => {
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
            };

            // Gerar WebGL Fingerprint
            const getWebGLFingerprint = () => {
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
            };

            // Obter fontes disponíveis
            const getFonts = () => {
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
            };

            // Obter plugins
            const getPlugins = () => {
                const plugins = [];
                for (let i = 0; i < navigator.plugins.length; i++) {
                    const plugin = navigator.plugins[i];
                    plugins.push(plugin.name);
                }
                return plugins;
            };

            const fingerprint = {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                screenResolution: screen.width + 'x' + screen.height,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                canvasFingerprint: getCanvasFingerprint(),
                webglFingerprint: getWebGLFingerprint(),
                fonts: getFonts(),
                plugins: getPlugins(),
                cookies: navigator.cookieEnabled,
                localStorage: typeof Storage !== 'undefined' && !!window.localStorage,
                sessionStorage: typeof Storage !== 'undefined' && !!window.sessionStorage,
                indexedDb: typeof indexedDB !== 'undefined',
                hardwareConcurrency: navigator.hardwareConcurrency || 0,
                deviceMemory: navigator.deviceMemory || 0,
                maxTouchPoints: navigator.maxTouchPoints || 0
            };

            // Gerar hash
            const fingerprintString = JSON.stringify(fingerprint);
            const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprintString));
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            // Armazenar para uso futuro
            localStorage.setItem('deviceFingerprint', hashHex);
            
            console.log('🔒 [SECURITY] Fingerprint gerado:', hashHex.substring(0, 20) + '...');
            return hashHex;

        } catch (error) {
            console.error('❌ [SECURITY] Erro ao gerar fingerprint:', error);
            return '';
        }
    }

    setupAxiosInterceptor() {
        // Interceptor para adicionar fingerprint em todas as requisições
        if (window.axios) {
            window.axios.interceptors.request.use((config) => {
                if (this.fingerprint) {
                    config.headers['X-Device-Fingerprint'] = this.fingerprint;
                }
                return config;
            });
        }
    }

    setupEventListeners() {
        // Detectar tentativas de fraude
        let suspiciousAttempts = 0;
        const maxAttempts = 3;

        document.addEventListener('keydown', (e) => {
            // Detectar DevTools
            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
                suspiciousAttempts++;
                console.warn(`⚠️ [SECURITY] Tentativa suspeita #${suspiciousAttempts}: DevTools`);
                
                if (suspiciousAttempts >= maxAttempts) {
                    this.reportSuspiciousActivity('DevTools access', suspiciousAttempts);
                }
            }
        });

        // Detectar mudança de tamanho de janela (possível inspector)
        let resizeCount = 0;
        const originalWidth = window.innerWidth;
        const originalHeight = window.innerHeight;
        
        window.addEventListener('resize', () => {
            resizeCount++;
            if (resizeCount > 5) {
                this.reportSuspiciousActivity('Excessive window resizing', resizeCount);
            }
        });
    }

    reportSuspiciousActivity(activity, count) {
        console.warn(`🚨 [SECURITY] Atividade suspeita detectada: ${activity} (${count}x)`);
        
        // Enviar relatório para o backend
        if (window.axios && this.fingerprint) {
            window.axios.post('/api/fraud/report-suspicious', {
                activity,
                count,
                fingerprint: this.fingerprint,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            }).catch(error => {
                console.error('❌ [SECURITY] Erro ao reportar atividade suspeita:', error);
            });
        }
    }

    // Validação de pagamento confirmado
    async validatePaymentConfirmation(orderId, paymentConfirmationId, paymentStatus) {
        try {
            if (!paymentConfirmationId || paymentStatus !== 'approved') {
                throw new Error('Pagamento não confirmado');
            }

            const response = await window.axios.post('/api/purchase/confirm', {
                orderId,
                paymentConfirmationId,
                paymentStatus
            });

            return response.data;
        } catch (error) {
            console.error('❌ [SECURITY] Erro na validação de pagamento:', error);
            
            // Se for erro de fraude, pode ser necessário banir o usuário
            if (error.response?.status === 403) {
                this.handleFraudDetection(error.response.data);
            }
            
            throw error;
        }
    }

    handleFraudDetection(fraudData) {
        console.error('🚫 [SECURITY] Fraude detectada:', fraudData);
        
        // Mostrar mensagem para o usuário
        alert('Acesso bloqueado por violação dos termos de uso. Contate o suporte se acreditar que isso é um erro.');
        
        // Redirecionar para página de bloqueio
        window.location.href = '/blocked';
    }

    // Verificar se usuário está banido
    async checkBanStatus() {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) return false;

            const response = await window.axios.get(`/api/fraud/check/user/${userId}`);
            
            if (response.data.isBanned) {
                this.handleFraudDetection({ reason: response.data.ban.reason });
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ [SECURITY] Erro ao verificar status de banimento:', error);
            return false;
        }
    }
}

// Inicializar o gerenciador de segurança
const securityManager = new SecurityManager();

// Exportar para uso global
window.securityManager = securityManager;

// Verificar status de banimento ao carregar
document.addEventListener('DOMContentLoaded', () => {
    securityManager.checkBanStatus();
});
