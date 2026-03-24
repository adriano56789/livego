import { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

/**
 * Hook centralizado para dados do usuário
 * Fonte oficial: Banco de dados (API)
 * Não depende de localStorage para dados críticos
 */
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
                
                console.log('[useUserData] Buscando dados do usuário do banco:', userId);
                
                // Buscar dados completos da API (fonte oficial)
                const response = await api.getCompleteUserData(userId);
                
                if (response) {
                    console.log('[useUserData] Dados recebidos:', response);
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
