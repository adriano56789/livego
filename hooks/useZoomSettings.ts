import { useEffect } from 'react';
import { api } from '../services/api';

export const useZoomSettings = (userId?: string) => {
    useEffect(() => {
        if (!userId) return;

        const loadAndApplyZoom = async () => {
            try {
                // Primeiro tentar do localStorage (para carregamento rápido)
                const savedZoom = localStorage.getItem('userZoom');
                if (savedZoom) {
                    const zoomLevel = parseInt(savedZoom);
                    applyZoomToDocument(zoomLevel);
                }

                // Depois carregar do backend e aplicar se for diferente
                const settings = await api.getZoomSettings(userId);
                if (settings && settings.zoomLevel) {
                    const backendZoom = settings.zoomLevel.toString();
                    if (localStorage.getItem('userZoom') !== backendZoom) {
                        applyZoomToDocument(settings.zoomLevel);
                        localStorage.setItem('userZoom', settings.zoomLevel.toString());
                    }
                }
            } catch (error) {
                console.error('Erro ao carregar configurações de zoom:', error);
                // Fallback para 100% se houver erro
                applyZoomToDocument(100);
            }
        };

        loadAndApplyZoom();

        // Listener para mudanças no localStorage (para sincronização entre abas)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'userZoom' && e.newValue) {
                applyZoomToDocument(parseInt(e.newValue));
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Cleanup
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [userId]);
};

const applyZoomToDocument = (level: number) => {
    const zoomFactor = level / 100;
    document.documentElement.style.transform = `scale(${zoomFactor})`;
    document.documentElement.style.transformOrigin = 'top left';
    document.documentElement.style.width = `${100 / zoomFactor}%`;
    document.documentElement.style.height = `${100 / zoomFactor}%`;
    document.documentElement.style.overflow = 'hidden';
};

export const resetZoom = () => {
    applyZoomToDocument(100);
    localStorage.removeItem('userZoom');
};
