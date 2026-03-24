// Sistema de IDs Reais - LiveGo
// Gera IDs únicos e identificáveis para usuários e salas

export interface RealStreamID {
  userId: string;        // ID único do usuário
  streamId: string;      // ID único do stream
  roomId: string;        // ID da sala (combinação)
  displayName: string;   // Nome para exibição
}

export class RealIDGenerator {
  // Gerar ID real para usuário baseado no ID existente
  static generateUserID(existingId: string, userName: string): string {
    // Se já tem um ID numérico, usar ele
    if (/^\d+$/.test(existingId)) {
      return `user_${existingId}`;
    }
    
    // Se já tem formato user_, manter
    if (existingId.startsWith('user_')) {
      return existingId;
    }
    
    // Gerar novo ID baseado no timestamp + hash do nome
    const nameHash = userName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 4);
    const timestamp = Date.now().toString(36);
    return `user_${timestamp}_${nameHash}`;
  }

  // Gerar ID real para stream
  static generateStreamID(userId: string, userName: string): string {
    const userBase = userId.replace('user_', '');
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `stream_${userBase}_${timestamp}_${random}`;
  }

  // Gerar ID da sala (room)
  static generateRoomID(streamId: string): string {
    return `room_${streamId.replace('stream_', '')}`;
  }

  // Criar sistema completo de IDs para um stream
  static createStreamSystem(userId: string, userName: string): RealStreamID {
    const realUserId = this.generateUserID(userId, userName);
    const streamId = this.generateStreamID(realUserId, userName);
    const roomId = this.generateRoomID(streamId);
    const displayName = `${userName} (${realUserId})`;

    return {
      userId: realUserId,
      streamId,
      roomId,
      displayName
    };
  }

  // Extrair informações de um streamId
  static parseStreamID(streamId: string): { userId: string; timestamp: string; random: string } | null {
    const match = streamId.match(/^stream_(user_[^_]+)_(.+?)_(.+)$/);
    if (!match) return null;

    return {
      userId: match[1],
      timestamp: match[2],
      random: match[3]
    };
  }

  // Extrair userId de um streamId
  static extractUserID(streamId: string): string | null {
    const parsed = this.parseStreamID(streamId);
    return parsed?.userId || null;
  }

  // Verificar se streamId é válido
  static isValidStreamID(streamId: string): boolean {
    return /^stream_user_\d+_[a-z0-9]+_[a-z0-9]{4}$/.test(streamId);
  }

  // Gerar URLs baseadas nos IDs reais
  static generateStreamURLs(streamId: string, userName: string) {
    const baseUrl = '72.60.249.175';
    
    return {
      displayName: `${userName} (${streamId})`,
      webrtc: `webrtc://${baseUrl}/live/${streamId}`,
      hls: `http://${baseUrl}:8000/live/${streamId}.m3u8`,
      flv: `http://${baseUrl}:8088/live/${streamId}.flv`,
      rtmp: `rtmp://${baseUrl}:1935/live/${streamId}`,
      api: `http://${baseUrl}:8080/api/v1/rtc/v1/play`,
      room: `room_${streamId.replace('stream_', '')}`
    };
  }

  // Formatar nome para exibição
  static formatDisplayName(userName: string, userId: string): string {
    const shortId = userId.replace('user_', '').substring(0, 8);
    return `${userName} (${shortId})`;
  }
}

export default RealIDGenerator;
