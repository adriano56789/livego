import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de proteção contra gravação e scraping
 * Detecta ferramentas de gravação e acesso direto à API
 * e bloqueia automaticamente o acesso
 */
export function antiRecordingProtection(req: Request, res: Response, next: NextFunction) {
    const userAgent = req.get('User-Agent') || '';
    const referer = req.get('Referer') || '';
    
    console.log(`🔍 [SECURITY] Anti-recording check - User-Agent: ${userAgent}, Referer: ${referer}`);
    
    // DETECÇÃO DE FERRAMENTAS DE GRAVAÇÃO/SCRAPING - PROTEÇÃO MÁXIMA
    const recordingIndicators = [
        // Ferramentas de gravação de vídeo
        'ffmpeg', 'vlc', 'obs', 'streamrecorder', 'youtube-dl', 'yt-dlp',
        'wget', 'curl', 'python-requests', 'node-fetch', 'postman',
        'insomnia', 'swagger', 'api-client', 'httpie', 'scrapy',
        
        // Bots e automação (TELEGRAM, DISCORD, ETC)
        'telethon', 'pyrogram', 'aiogram', 'discord.py', 'selenium',
        'puppeteer', 'playwright', 'cheerio', 'beautifulsoup',
        
        // Bibliotecas HTTP comuns em bots
        'axios', 'request', 'urllib', 'httpx', 'aiohttp',
        
        // User-Agers suspeitos
        'bot', 'crawler', 'spider', 'scraper', 'harvest', 'extract',
        'monitor', 'audit', 'scan', 'test', 'check', 'verify',
        
        // Ferramentas de desenvolvedor
        'postman', 'insomnia', 'hoppscotch', 'thunderclient',
        'rest-client', 'advanced-rest-client', 'boomerang',
        
        // Linguagens de programação (sem browser)
        'python', 'java', 'node', 'php', 'ruby', 'go', 'rust',
        'perl', 'bash', 'powershell', 'curl', 'wget'
    ];
    
    const isRecordingAttempt = recordingIndicators.some(indicator => 
        userAgent.toLowerCase().includes(indicator.toLowerCase())
    );
    
    // Verificar se é acesso direto à API (sem referer do app)
    const isDirectApiAccess = !referer || (
        referer.includes('localhost') && 
        (userAgent.includes('curl') || userAgent.includes('wget') || userAgent.includes('python'))
    );
    
    // Verificar se é um bot/automatizado - DETECÇÃO AVANÇADA
    const isBot = userAgent.includes('bot') || 
                  userAgent.includes('crawler') || 
                  userAgent.includes('spider') ||
                  userAgent.includes('scraper') ||
                  userAgent.includes('harvest') ||
                  userAgent.includes('extract') ||
                  userAgent.includes('monitor') ||
                  userAgent.includes('audit') ||
                  userAgent.includes('scan') ||
                  !userAgent.includes('mozilla') && !userAgent.includes('chrome') && !userAgent.includes('safari') ||
                  userAgent.length < 20 || // User-Agent muito curto = suspeito
                  /\d+\.\d+\.\d+\.\d+/.test(userAgent); // IP no User-Agent
    
    // 🚨 BLOQUEAR ACESSO DE FERRAMENTAS DE GRAVAÇÃO
    if (isRecordingAttempt || isDirectApiAccess || isBot) {
        console.log(`🚨 [RECORDING BLOCKED] Access blocked - User-Agent: ${userAgent}, IP: ${req.ip}`);
        
        // Retornar resposta diferente dependendo do tipo de acesso
        if (req.path.includes('/live') || req.path.includes('/stream')) {
            // Para lives: retornar tela preta/dados falsos
            return res.json({
                id: 'blocked',
                name: 'Stream Unavailable',
                avatar: '',
                viewers: 0,
                diamonds: 0,
                isLive: false,
                country: 'XX',
                location: 'Hidden',
                message: 'Stream unavailable',
                tags: [],
                isPrivate: true,
                quality: 'blocked',
                playbackUrl: '',
                isBlocked: true
            });
        } else {
            // Para outras APIs: retornar erro ou lista vazia
            if (req.path.includes('/fans') || req.path.includes('/following') || req.path.includes('/friends')) {
                return res.json([]); // Lista vazia para redes sociais
            } else {
                return res.status(403).json({ 
                    error: 'Access denied',
                    message: 'Unauthorized access attempt detected'
                });
            }
        }
    }
    
    // Se passou por todas as verificações, continuar
    next();
}

/**
 * Middleware para ocultar dados sensíveis em respostas
 * Remove campos sensíveis antes de enviar ao cliente
 */
export function hideSensitiveData(req: Request, res: Response, next: NextFunction) {
    const originalJson = res.json;
    
    res.json = function(data: any) {
        if (data && typeof data === 'object') {
            // Se for um array de objetos, processar cada item
            if (Array.isArray(data)) {
                data = data.map(item => removeSensitiveFields(item));
            } else {
                // Se for um objeto único
                data = removeSensitiveFields(data);
            }
        }
        
        return originalJson.call(this, data);
    };
    
    next();
}

/**
 * Remove campos sensíveis de um objeto
 */
function removeSensitiveFields(obj: any): any {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    
    const sensitiveFields = [
        'email', 'phone', 'password', 'withdrawal_method', 
        'location', 'ip', 'sessionId', 'token', 'refreshToken',
        'followersList', 'followingList', 'friendsList', 'blockedUsers',
        'messages', 'notifications', 'visitors', 'identification',
        'hostId', 'rtmpIngestUrl', 'streamKey', 'srtIngestUrl'
    ];
    
    // Criar cópia para não modificar o original
    const cleaned = { ...obj };
    
    // Remover campos sensíveis
    sensitiveFields.forEach(field => {
        delete cleaned[field];
    });
    
    // Para campos específicos, substituir por valores seguros
    if (cleaned.country === undefined || cleaned.country === null) {
        cleaned.country = 'XX';
    }
    
    if (cleaned.location === undefined || cleaned.location === null) {
        cleaned.location = 'Hidden';
    }
    
    if (cleaned.identification) {
        cleaned.identification = '';
    }
    
    // Remover arrays sensíveis
    if (Array.isArray(cleaned.followersList)) cleaned.followersList = [];
    if (Array.isArray(cleaned.followingList)) cleaned.followingList = [];
    if (Array.isArray(cleaned.friendsList)) cleaned.friendsList = [];
    if (Array.isArray(cleaned.blockedUsers)) cleaned.blockedUsers = [];
    if (Array.isArray(cleaned.messages)) cleaned.messages = [];
    if (Array.isArray(cleaned.notifications)) cleaned.notifications = [];
    if (Array.isArray(cleaned.visitors)) cleaned.visitors = [];
    
    return cleaned;
}
