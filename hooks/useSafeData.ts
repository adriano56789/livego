import { useState, useEffect, useCallback } from 'react';

interface SafeDataOptions<T> {
    initialValue?: T;
    fallback?: T;
    validate?: (data: T) => boolean;
    onError?: (error: Error) => void;
}

interface SafeDataResult<T> {
    data: T | undefined;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    setData: (data: T) => void;
    isValid: boolean;
}

export function useSafeData<T>(
    fetcher: () => Promise<T>,
    options: SafeDataOptions<T> = {}
): SafeDataResult<T> {
    const { initialValue, fallback, validate, onError } = options;
    
    const [data, setData] = useState<T | undefined>(initialValue);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const isValid = useCallback((dataToCheck: any): dataToCheck is T => {
        if (!dataToCheck) return false;
        if (validate) return validate(dataToCheck);
        return true;
    }, [validate]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const result = await fetcher();
            
            if (isValid(result)) {
                setData(result);
            } else {
                const validationError = new Error('Dados inválidos recebidos da API');
                setError(validationError);
                if (onError) onError(validationError);
                if (fallback !== undefined) setData(fallback);
            }
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Erro desconhecido');
            setError(error);
            if (onError) onError(error);
            if (fallback !== undefined) setData(fallback);
        } finally {
            setLoading(false);
        }
    }, [fetcher, isValid, onError, fallback]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        data,
        loading,
        error,
        refetch: fetchData,
        setData: (newData: T) => {
            if (isValid(newData)) {
                setData(newData);
            } else {
                const validationError = new Error('Dados inválidos');
                setError(validationError);
                if (onError) onError(validationError);
            }
        },
        isValid: data !== undefined && isValid(data)
    };
}

// Hook para renderização segura com fallback
export function useSafeRender<T>(data: T | undefined, fallback: T): T {
    return data !== undefined && data !== null ? data : fallback;
}

// Função utilitária para acesso seguro a propriedades aninhadas
export function safeGet<T>(obj: any, path: string, fallback: T): T {
    try {
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current === null || current === undefined) {
                return fallback;
            }
            current = current[key];
        }
        
        return current !== undefined && current !== null ? current : fallback;
    } catch {
        return fallback;
    }
}

// Função para validar objetos
export function validateObject(obj: any, requiredFields: string[]): boolean {
    if (!obj || typeof obj !== 'object') return false;
    
    return requiredFields.every(field => {
        const value = safeGet(obj, field, null);
        return value !== null && value !== undefined;
    });
}

// Hook para chamadas de API seguras
export function useSafeApi<T>() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const callApi = useCallback(async (
        apiCall: () => Promise<T>,
        options: { fallback?: T; validate?: (data: T) => boolean } = {}
    ): Promise<{ data?: T; error?: Error }> => {
        try {
            setLoading(true);
            setError(null);
            
            const result = await apiCall();
            
            if (options.validate && !options.validate(result)) {
                throw new Error('Dados inválidos recebidos da API');
            }
            
            return { data: result };
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Erro desconhecido');
            setError(error);
            return { data: options.fallback, error };
        } finally {
            setLoading(false);
        }
    }, []);

    return { callApi, loading, error };
}
