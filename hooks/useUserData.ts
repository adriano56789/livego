import { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

/**
 * Hook centralizado para dados do usuário
 * Fonte oficial: Banco de dados (API)
 * Não depende de localStorage para dados críticos
 */

// Função para mascarar dados sensíveis em logs
const maskSensitiveData = (data: any): any => {
    if (!data) return data;
    
    // Se for string, verificar se contém dados sensíveis
    if (typeof data === 'string') {
        // Mascarar email - ocultar completamente o nome do usuário
        if (data.includes('@')) {
            const emailMatch = data.match(/([a-zA-Z0-9._-]+)@([a-zA-Z0-9.-]+)/);
            if (emailMatch) {
                const domain = emailMatch[2];
                return `*********@${domain}`;
            }
        }
        
        // Mascarar userId (padrão: sequência de números)
        const userIdMatch = data.match(/\b(\d{8,})\b/);
        if (userIdMatch) {
            const userId = userIdMatch[1];
            return data.replace(userId, userId.substring(0, 2) + '*'.repeat(userId.length - 2));
        }
        
        return data;
    }
    
    // Se for objeto, mascarar campos específicos
    if (typeof data === 'object') {
        const masked = { ...data };
        
        // Mascarar campos sensíveis
        if (masked.userId || masked.id) {
            const id = masked.userId || masked.id;
            if (typeof id === 'string' && id.length > 2) {
                const maskedId = id.substring(0, 2) + '*'.repeat(id.length - 2);
                if (masked.userId) masked.userId = maskedId;
                if (masked.id) masked.id = maskedId;
            }
        }
        
        if (masked.email) {
            const emailMatch = masked.email.match(/([a-zA-Z0-9._-]+)@([a-zA-Z0-9.-]+)/);
            if (emailMatch) {
                const domain = emailMatch[2];
                masked.email = `*********@${domain}`;
            }
        }
        
        if (masked.withdrawal_method) {
            if (masked.withdrawal_method.details?.pixKey) {
                const pixKey = masked.withdrawal_method.details.pixKey;
                if (typeof pixKey === 'string' && pixKey.includes('@')) {
                    const emailMatch = pixKey.match(/([a-zA-Z0-9._-]+)@([a-zA-Z0-9.-]+)/);
                    if (emailMatch) {
                        const domain = emailMatch[2];
                        masked.withdrawal_method.details.pixKey = `*********@${domain}`;
                    }
                }
            }
        }
        
        return masked;
    }
    
    return data;
};

export const useUserData = (userId?: string) => {
    const [userData, setUserData] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!userId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                
                console.log('[useUserData] Buscando dados do usuário do banco:', maskSensitiveData(userId));
                
                // Buscar dados completos da API (fonte oficial)
                const response = await api.getCompleteUserData(userId);
                
                if (response) {
                    console.log('[useUserData] Dados recebidos (mascarados):', maskSensitiveData(response));
                    setUserData(response);
                } else {
                    throw new Error('Falha ao carregar dados do usuário');
                }
            } catch (err: any) {
                console.error('[useUserData] Erro:', err);
                setError(err.message || 'Erro ao carregar dados');
                setUserData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [userId]);

    return {
        userData,
        loading,
        error,
        refetch: () => {
            if (userId) {
                setLoading(true);
                return api.getCompleteUserData(userId);
            }
        }
    };
};
