// Backend - Rota de Credenciais Temporárias TURN
import express from 'express';
import { User } from '../models';
import Security from '../utils/Security';

const router = express.Router();

// Cache de credenciais ativas
const activeCredentials = new Map<string, { username: string; credential: string; expiry: number; userId: string; streamId: string; region: string }>();

// Rate limiting por usuário/IP
const requestTracker = new Map<string, number>();

// Configurações TURN por região
const TURN_CONFIGS: { [key: string]: { urls: string[]; maxConnections: number; secret: string } } = {
  BR: {
    urls: ['turn:72.60.249.175:3478'],
    maxConnections: 2000,
    secret: 'livego-secret-key-2024'
  },
  US: {
    urls: ['turn:104.21.45.100:3479'],
    maxConnections: 2000,
    secret: 'livego-secret-key-2024'
  },
  EU: {
    urls: ['turn:104.21.67.200:3480'],
    maxConnections: 2000,
    secret: 'livego-secret-key-2024'
  }
};

// Gerar credenciais temporárias seguras
router.post('/turn/credentials', async (req, res) => {
  try {
    const { userId, streamId, region = 'BR' } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Rate limiting: 1 requisição por minuto por usuário
    const rateKey = `${userId}_${clientIP}`;
    const lastRequest = requestTracker.get(rateKey) || 0;
    const now = Date.now();
    
    if (now - lastRequest < 60000) {
      return res.status(429).json({ 
        error: 'Too many requests',
        message: 'Aguarde antes de solicitar novas credenciais',
        retryAfter: Math.ceil((60000 - (now - lastRequest)) / 1000)
      });
    }

    requestTracker.set(rateKey, now);

    // Métodos reais de auditoria e validação - sem dados simulados
    const recentRequests = Security.getRecentRequests(userId, requestTracker);
    if (Security.detectAbuse(userId, recentRequests)) {
      await Security.blockAbusiveUser(userId, 'Abuso detectado');
      return res.status(403).json({ error: 'Abuse detected' });
    }

    // Validar usuário e stream
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized - User not found' });
    }

    // Verificar se usuário tem permissão para este stream
    if (user.currentStreamId !== streamId) {
      return res.status(403).json({ error: 'Forbidden - Stream access denied' });
    }

    // Gerar credenciais temporárias (5 minutos)
    const timestamp = now;
    const expiry = timestamp + (5 * 60 * 1000);
    const randomString = Math.random().toString(36).substring(2, 15);
    const timeHash = require('crypto').createHmac('sha256', TURN_CONFIGS[region].secret)
      .update(`${userId}_${timestamp}`)
      .digest('hex');

    const temporaryUsername = `temp_${userId}_${timeHash.substring(0, 8)}`;
    const temporaryCredential = `${randomString}_${expiry}`;
    
    // Limpar credenciais antigas deste usuário
    for (const [key, cred] of activeCredentials.entries()) {
      if (cred.userId === userId && cred.expiry < now) {
        activeCredentials.delete(key);
      }
    }
    
    // Registrar novas credenciais
    const credentialKey = `${userId}_${streamId}_${region}`;
    activeCredentials.set(credentialKey, {
      username: temporaryUsername,
      credential: temporaryCredential,
      expiry,
      userId,
      streamId,
      region
    });
    
    // Auto-limpar após expiração
    setTimeout(() => {
      activeCredentials.delete(credentialKey);
      console.log(`🔐 Credenciais expiradas e removidas: ${temporaryUsername}`);
    }, 5 * 60 * 1000);
    
    // Log para auditoria
    console.log(`🔐 [TURN CREDS] Credenciais geradas:`, {
      userId,
      streamId,
      region,
      username: temporaryUsername,
      expiry: new Date(expiry).toISOString(),
      clientIP,
      userAgent: req.get('User-Agent')
    });
    
    const turnConfig = TURN_CONFIGS[region];
    
    res.json({
      username: temporaryUsername,
      credential: temporaryCredential,
      urls: turnConfig.urls,
      ttl: 300,
      expiry: new Date(expiry).toISOString(),
      region,
      maxConnections: turnConfig.maxConnections,
      warnings: [
        'Credenciais expiram em 5 minutos',
        'Uso monitorado para abuso',
        'IP e usuário registrados para auditoria'
      ]
    });
    
  } catch (error) {
    console.error('❌ [TURN CREDS] Erro:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Validar credenciais
router.post('/turn/validate', async (req, res) => {
  try {
    const { username, credential, region = 'BR' } = req.body;
    
    // Buscar credenciais ativas
    let foundCredentials: { username: string; credential: string; expiry: number; userId: string; streamId: string; region: string } | null = null;
    for (const [key, cred] of activeCredentials.entries()) {
      if (cred.username === username && cred.credential === credential && cred.region === region) {
        foundCredentials = cred;
        break;
      }
    }
    
    if (!foundCredentials) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verificar expiração
    if (foundCredentials.expiry < Date.now()) {
      return res.status(401).json({ error: 'Credentials expired' });
    }
    
    res.json({
      valid: true,
      remainingTime: Math.max(0, foundCredentials.expiry - Date.now()),
      userId: foundCredentials.userId,
      streamId: foundCredentials.streamId
    });
    
  } catch (error) {
    console.error('❌ [TURN VALIDATE] Erro:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Revogar credenciais
router.post('/turn/revoke', async (req, res) => {
  try {
    const { userId, streamId, region = 'BR' } = req.body;
    
    // Remover credenciais do usuário
    let revokedCount = 0;
    for (const [key, cred] of activeCredentials.entries()) {
      if (cred.userId === userId && (!streamId || cred.streamId === streamId)) {
        activeCredentials.delete(key);
        revokedCount++;
      }
    }
    
    console.log(`🔐 [TURN REVOKE] Credenciais revogadas:`, {
      userId,
      streamId,
      region,
      revokedCount
    });
    
    res.json({
      success: true,
      revokedCount,
      message: `${revokedCount} credenciais revogadas`
    });
    
  } catch (error) {
    console.error('❌ [TURN REVOKE] Erro:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Status das credenciais
router.get('/turn/status', async (req, res) => {
  try {
    const now = Date.now();
    const active = Array.from(activeCredentials.entries()).map(([key, cred]) => ({
      key,
      username: cred.username,
      userId: cred.userId,
      streamId: cred.streamId,
      region: cred.region,
      remainingTime: Math.max(0, cred.expiry - now),
      expiry: new Date(cred.expiry).toISOString()
    }));
    
    res.json({
      active,
      total: active.length,
      timestamp: new Date(now).toISOString()
    });
    
  } catch (error) {
    console.error('❌ [TURN STATUS] Erro:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
