// Classe de Segurança Real - Sem Dados Simulados
export class Security {
  // Obter IP real do cliente
  static async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn('Falha ao obter IP:', error);
      return 'unknown';
    }
  }
  
  // Detectar abuso real baseado em métricas
  static detectAbuse(userId: string, recentRequests: any[]): boolean {
    // Muitas credenciais em pouco tempo (mais de 10 em 1 hora)
    if (recentRequests.length > 10) {
      console.warn('🚨 Abuso detectado - muitas requisições:', {
        userId,
        requestCount: recentRequests.length
      });
      return true;
    }
    
    // Múltiplas regiões simultâneas (mais de 3)
    const regions = new Set(recentRequests.map(r => r.region));
    if (regions.size > 3) {
      console.warn('🚨 Abuso detectado - múltiplas regiões:', {
        userId,
        regions: Array.from(regions)
      });
      return true;
    }
    
    // Requisições muito rápidas (menos de 30 segundos entre elas)
    const sortedRequests = recentRequests.sort((a, b) => a.timestamp - b.timestamp);
    for (let i = 1; i < sortedRequests.length; i++) {
      const timeDiff = sortedRequests[i].timestamp - sortedRequests[i-1].timestamp;
      if (timeDiff < 30000) { // 30 segundos
        console.warn('🚨 Abuso detectado - requisições muito rápidas:', {
          userId,
          timeDiff
        });
        return true;
      }
    }
    
    return false;
  }
  
  // Bloquear usuário real no sistema
  static async blockAbusiveUser(userId: string, reason: string, duration: number = 3600): Promise<void> {
    try {
      const clientIP = await this.getClientIP();
      
      const response = await fetch('/api/security/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          reason,
          timestamp: new Date().toISOString(),
          clientIP,
          permanent: false,
          duration
        })
      });
      
      if (response.ok) {
        console.log('🚫 Usuário bloqueado com sucesso:', {
          userId,
          reason,
          duration
        });
      } else {
        throw new Error('Falha ao bloquear usuário');
      }
    } catch (error) {
      console.error('❌ Falha ao bloquear usuário abusivo:', error);
      throw error;
    }
  }
  
  // Registrar auditoria real no banco
  static async auditCredentialsUsage(userId: string, action: string, metadata: any = {}): Promise<void> {
    try {
      const clientIP = await this.getClientIP();
      
      const auditData = {
        userId,
        action,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        clientIP,
        metadata
      };
      
      const response = await fetch('/api/security/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auditData)
      });
      
      if (!response.ok) {
        console.warn('⚠️ Falha ao registrar auditoria:', auditData);
      }
    } catch (error) {
      console.error('❌ Erro na auditoria:', error);
    }
  }
  
  // Obter requisições recentes do cache real
  static getRecentRequests(userId: string, requestTracker: Map<string, number>): any[] {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    return Array.from(requestTracker.entries())
      .filter(([key, timestamp]) => {
        return key.includes(userId) && timestamp > oneHourAgo;
      })
      .map(([key, timestamp]) => ({
        key,
        timestamp,
        region: key.split('_')[2] || 'BR',
        timeAgo: now - timestamp
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }
  
  // Verificar se IP está em blacklist
  static async isIPBlacklisted(ip: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/security/ip-check/${ip}`);
      const data = await response.json();
      return data.blacklisted || false;
    } catch (error) {
      console.warn('Falha ao verificar blacklist IP:', error);
      return false;
    }
  }
  
  // Calcular score de risco do usuário
  static calculateRiskScore(userId: string, userHistory: any): number {
    let riskScore = 0;
    
    // Histórico de bloqueios anteriores
    if (userHistory.previousBlocks > 0) {
      riskScore += userHistory.previousBlocks * 20;
    }
    
    // Conta recente (menos de 7 dias)
    const accountAge = Date.now() - new Date(userHistory.createdAt).getTime();
    if (accountAge < 7 * 24 * 60 * 60 * 1000) {
      riskScore += 15;
    }
    
    // Muitas tentativas de login falhas
    if (userHistory.failedLogins > 5) {
      riskScore += userHistory.failedLogins * 5;
    }
    
    // Padrões suspeitos de uso
    if (userHistory.suspiciousPatterns > 0) {
      riskScore += userHistory.suspiciousPatterns * 10;
    }
    
    return Math.min(riskScore, 100); // Máximo 100
  }
  
  // Verificar se usuário deve ser limitado
  static shouldThrottleUser(userId: string, riskScore: number): boolean {
    // Limitar se score de risco > 50
    return riskScore > 50;
  }
}

export default Security;
