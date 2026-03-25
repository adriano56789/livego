import { useEffect } from 'react';
import { api } from '../services/api';

export const useZoomSettings = (userId?: string) => {
    useEffect(() => {
        if (!userId) return;

        const loadAndApplyZoom = async () => {
            try {
                // Sempre buscar do backend - não usar localStorage
                const settings = await api.getZoomSettings(userId);
                if (settings && settings.zoomLevel) {
                    applyZoomToDocument(settings.zoomLevel);
                } else {
                    // Fallback para 100% se não houver configuração
                    applyZoomToDocument(100);
                }
            } catch (error) {
                console.error('Erro ao carregar configurações de zoom:', error);
                // Fallback para 100% se houver erro
                applyZoomToDocument(100);
            }
        };

        loadAndApplyZoom();
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
};
