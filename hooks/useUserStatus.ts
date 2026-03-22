import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { socketService } from '../services/socket';

export interface UserStatus {
    user_id: string;
    is_online: boolean;
    last_seen: string;
    updated_at: string;
}

export const useUserStatus = (userId?: string) => {
    const [status, setStatus] = useState<UserStatus | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Carregar status do usuário
    const loadUserStatus = useCallback(async () => {
        if (!userId) return;
        
        try {
            setIsLoading(true);
            const userStatus = await api.getUserStatus(userId);
            if (userStatus) {
                setStatus(userStatus);
            }
        } catch (error) {
            console.error('Erro ao carregar status do usuário:', error);
            // Em caso de erro, definir um status padrão offline
            setStatus({
                user_id: userId,
                is_online: false,
                last_seen: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // Marcar usuário como online
    const setUserOnline = useCallback(async () => {
        if (!userId) return;
        
        try {
            await api.setUserOnline(userId);
            const socket = socketService.getSocket();
            if (socket?.connected) {
                socket.emit('user_online', { userId });
            }
            loadUserStatus(); // Recarregar status
        } catch (error) {
            console.error('Erro ao marcar usuário como online:', error);
        }
    }, [userId, loadUserStatus]);

    // Marcar usuário como offline
    const setUserOffline = useCallback(async () => {
        if (!userId) return;
        
        try {
            await api.setUserOffline(userId);
            const socket = socketService.getSocket();
            if (socket?.connected) {
                socket.emit('user_offline', { userId });
            }
            loadUserStatus(); // Recarregar status
        } catch (error) {
            console.error('Erro ao marcar usuário como offline:', error);
        }
    }, [userId, loadUserStatus]);

    // Atualizar status (unificado)
    const updateUserStatus = useCallback(async (isOnline: boolean) => {
        if (!userId) return;
        
        try {
            await api.updateUserStatus(userId, isOnline);
            const socket = socketService.getSocket();
            if (socket?.connected) {
                socket.emit(isOnline ? 'user_online' : 'user_offline', { userId });
            }
            loadUserStatus(); // Recarregar status
        } catch (error) {
            console.error('Erro ao atualizar status do usuário:', error);
        }
    }, [userId, loadUserStatus]);

    // Carregar status quando o userId mudar
    useEffect(() => {
        if (userId) {
            // Adicionar timeout para garantir que não fique preso em loading
            const loadingTimeout = setTimeout(() => {
                setIsLoading(false);
            }, 3000); // 3 segundos máximo de loading
            
            loadUserStatus();
            
            return () => {
                clearTimeout(loadingTimeout);
            };
        }
    }, [userId, loadUserStatus]);

    // Configurar listeners de WebSocket para atualizações em tempo real
    useEffect(() => {
        if (!userId) return;

        const socket = socketService.getSocket();
        if (!socket?.connected) return;

        // Escutar mudanças de status de usuários
        const handleStatusChanged = (data: { user_id: string; is_online: boolean; last_seen?: string; timestamp: string }) => {
            if (data.user_id === userId) {
                setStatus(prev => prev ? {
                    ...prev,
                    is_online: data.is_online,
                    last_seen: data.last_seen || prev.last_seen,
                    updated_at: data.timestamp
                } : null);
            }
        };

        // Escuar solicitações de heartbeat
        const handleHeartbeatRequest = (data: { userId: string; timestamp: number }) => {
            if (data.userId === userId) {
                // Enviar resposta de heartbeat
                socket.emit('user_heartbeat', { userId });
            }
        };

        // Escutar confirmações de heartbeat
        const handleHeartbeatAck = (data: { userId: string; timestamp: number; nextHeartbeat: number }) => {
            if (data.userId === userId) {
                // Agendar próximo heartbeat
                setTimeout(() => {
                    const currentSocket = socketService.getSocket();
                    if (currentSocket?.connected) {
                        currentSocket.emit('user_heartbeat', { userId });
                    }
                }, data.nextHeartbeat - Date.now());
            }
        };

        socketService.on('user_status_changed', handleStatusChanged);
        socketService.on('heartbeat_request', handleHeartbeatRequest);
        socketService.on('heartbeat_ack', handleHeartbeatAck);

        return () => {
            socketService.off('user_status_changed', handleStatusChanged);
            socketService.off('heartbeat_request', handleHeartbeatRequest);
            socketService.off('heartbeat_ack', handleHeartbeatAck);
        };
    }, [userId]);

    return {
        status,
        isLoading,
        loadUserStatus,
        setUserOnline,
        setUserOffline,
        updateUserStatus
    };
};

// Hook para gerenciar múltiplos status de usuários
export const useBatchUserStatus = (userIds: string[]) => {
    const [statuses, setStatuses] = useState<Map<string, UserStatus>>(new Map());
    const [isLoading, setIsLoading] = useState(false);

    const loadBatchStatus = useCallback(async () => {
        if (userIds.length === 0) return;
        
        try {
            setIsLoading(true);
            const response = await api.getBatchUserStatus(userIds);
            
            const statusMap = new Map<string, UserStatus>();
            response.users.forEach(userStatus => {
                statusMap.set(userStatus.user_id, userStatus);
            });
            
            setStatuses(statusMap);
        } catch (error) {
            console.error('Erro ao carregar status em lote:', error);
        } finally {
            setIsLoading(false);
        }
    }, [userIds]);

    const getUserStatus = useCallback((userId: string) => {
        return statuses.get(userId);
    }, [statuses]);

    // Carregar status quando a lista de usuários mudar
    useEffect(() => {
        if (userIds.length > 0) {
            loadBatchStatus();
        }
    }, [userIds, loadBatchStatus]);

    // Configurar listeners para atualizações em tempo real
    useEffect(() => {
        const socket = socketService.getSocket();
        if (!socket?.connected) return;

        const handleStatusChanged = (data: { user_id: string; is_online: boolean; last_seen?: string; timestamp: string }) => {
            if (userIds.includes(data.user_id)) {
                setStatuses(prev => {
                    const newMap = new Map(prev);
                    const currentStatus = newMap.get(data.user_id);
                    newMap.set(data.user_id, currentStatus ? {
                        ...(currentStatus as UserStatus),
                        is_online: data.is_online,
                        last_seen: data.last_seen || (currentStatus as UserStatus).last_seen,
                        updated_at: data.timestamp
                    } : {
                        user_id: data.user_id,
                        is_online: data.is_online,
                        last_seen: (data.last_seen || new Date().toISOString()) as string,
                        updated_at: data.timestamp
                    });
                    return newMap;
                });
            }
        };

        socketService.on('user_status_changed', handleStatusChanged);

        return () => {
            socketService.off('user_status_changed', handleStatusChanged);
        };
    }, [userIds]);

    return {
        statuses,
        isLoading,
        loadBatchStatus,
        getUserStatus
    };
};

// Função utilitária para formatar texto de "última vez visto"
export const formatLastSeen = (lastSeen: string): string => {
    const diffMs = new Date().getTime() - new Date(lastSeen).getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "Online agora";
    if (diffMinutes < 60) return `Online há ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Online há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Online há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
};
