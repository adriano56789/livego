import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

// Tipos para dados brutos do SRS
export interface SRSRawStream {
  cid: string;
  app: string;
  stream: string;
  url: string;
  client_id: string;
  param?: string;
  tcUrl?: string;
  swfUrl?: string;
  pageUrl?: string;
  schema?: string;
  vhost?: string;
  alive: boolean;
  active: boolean;
  kbps?: {
    recv: number;
    send: number;
  };
  bytes?: {
    recv: number;
    send: number;
  };
  time_ms: number;
  timestamp: string;
}

export interface SRSRawClient {
  id: string;
  stream?: string;
  param?: string;
  url?: string;
  type: string;
  active: boolean;
  time_ms: number;
  bytes?: {
    recv: number;
    send: number;
  };
  kbps?: {
    recv: number;
    send: number;
  };
}

export interface SRSStreamMapped {
  // Dados do SRS
  cid: string;
  app: string;
  stream: string;
  url: string;
  client_id: string;
  alive: boolean;
  active: boolean;
  kbps: {
    recv: number;
    send: number;
  };
  bytes: {
    recv: number;
    send: number;
  };
  time_ms: number;
  timestamp: string;
  
  // Dados do usuário (do banco)
  user: {
    identification: string;
    name: string;
    avatarUrl: string;
    coverUrl?: string;
    level: number;
    fans: number;
    vip: boolean;
    bio?: string;
    country?: string;
    age?: number;
    gender?: 'male' | 'female' | 'not_specified';
    diamonds: number;
    earnings: number;
    isLive: boolean;
    chatPermission: 'all' | 'followers' | 'none';
    privateStreamSettings?: {
      privateInvite: boolean;
      followersOnly: boolean;
      fansOnly: boolean;
      friendsOnly: boolean;
    };
  } | null;
  
  mapped: boolean;
}

interface UseSRSStreamsReturn {
  streams: SRSStreamMapped[];
  loading: boolean;
  error: string | null;
  total: number;
  lastUpdate: string | null;
  refresh: () => Promise<void>;
  getStreamByUserId: (userId: string) => SRSStreamMapped | undefined;
  isUserLive: (userId: string) => boolean;
}

/**
 * Hook para gerenciar streams ativos do SRS em tempo real
 * Consome APIs oficiais do SRS e cruza com banco de dados
 * Atualiza automaticamente a cada 5 segundos
 * 
 * Mapeamento: stream.name (SRS) → user.id (banco)
 */
export const useSRSStreams = (refreshInterval: number = 5000): UseSRSStreamsReturn => {
  const [streams, setStreams] = useState<SRSStreamMapped[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const fetchStreams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Buscar streams brutos do SRS (API oficial)
      const srsResponse = await api.getSRSStreams(0, 100);
      
      if (!srsResponse || !srsResponse.success) {
        throw new Error(srsResponse?.error || 'Falha ao buscar streams do SRS');
      }

      const rawStreams: SRSRawStream[] = srsResponse.data || [];
      
      if (rawStreams.length === 0) {
        setStreams([]);
        setLastUpdate(new Date().toISOString());
        console.log('[SRS Streams] Nenhum stream ativo no SRS');
        return;
      }

      // 2. Mapear com dados do banco via API de mapeamento
      const mapResponse = await fetch('/api/map/srs-streams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streams: rawStreams
        })
      }).then(res => res.json());

      if (!mapResponse || !mapResponse.success) {
        console.warn('[SRS Streams] Falha no mapeamento, usando dados brutos:', mapResponse?.error);
        // Fallback: usar dados brutos sem mapeamento
        const fallbackStreams = rawStreams.map(stream => ({
          ...stream,
          kbps: stream.kbps || { recv: 0, send: 0 },
          bytes: stream.bytes || { recv: 0, send: 0 },
          user: null,
          mapped: false
        }));
        setStreams(fallbackStreams);
      } else {
        // Usar dados mapeados
        setStreams(mapResponse.data || []);
        console.log(`[SRS Streams] Mapeados ${mapResponse.mapped}/${rawStreams.length} streams`);
      }

      setLastUpdate(new Date().toISOString());

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('[SRS Streams] Erro ao buscar streams:', err);
      setStreams([]); // Limpar streams em caso de erro
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchStreams();
  }, [fetchStreams]);

  // Funções utilitárias
  const getStreamByUserId = useCallback((userId: string): SRSStreamMapped | undefined => {
    return streams.find(stream => stream.stream === userId);
  }, [streams]);

  const isUserLive = useCallback((userId: string): boolean => {
    const stream = getStreamByUserId(userId);
    return stream ? stream.alive && stream.active : false;
  }, [getStreamByUserId]);

  // Efeito inicial
  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  // Atualização automática em tempo real
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchStreams();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchStreams, refreshInterval]);

  return {
    streams,
    loading,
    error,
    total: streams.length,
    lastUpdate,
    refresh,
    getStreamByUserId,
    isUserLive
  };
};

/**
 * Hook para obter apenas streams de usuários seguidos
 */
export const useFollowingStreams = (followingList: string[] = []): SRSStreamMapped[] => {
  const { streams } = useSRSStreams(8000); // Atualiza a cada 8s
  
  return streams.filter(stream => 
    stream.user && followingList.includes(stream.user.identification)
  );
};

/**
 * Hook para obter streams populares (baseado em fans e diamantes)
 */
export const usePopularStreams = (limit: number = 20): SRSStreamMapped[] => {
  const { streams } = useSRSStreams(15000); // Atualiza a cada 15s
  
  return streams
    .filter(stream => stream.user && (stream.user.fans > 0 || stream.user.diamonds > 0))
    .sort((a, b) => {
      if (!a.user || !b.user) return 0;
      // Ordenar por popularidade (fans + diamantes recebidos)
      const scoreA = a.user.fans + a.user.diamonds;
      const scoreB = b.user.fans + b.user.diamonds;
      return scoreB - scoreA;
    })
    .slice(0, limit);
};

export default useSRSStreams;
