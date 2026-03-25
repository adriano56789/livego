import React, { useState, useEffect } from 'react';
import { BackIcon, MinusCircleIcon, PlusCircleIcon } from '../icons';
import { useTranslation } from '../../i18n';
import { api } from '../../services/api';

interface ZoomSettingsScreenProps {
    onBack: () => void;
    currentUser?: { id: string };
}

const ZoomSettingsScreen: React.FC<ZoomSettingsScreenProps> = ({ onBack, currentUser }) => {
    const { t } = useTranslation();
    const [zoomLevel, setZoomLevel] = useState(100);
    const [isLoading, setIsLoading] = useState(false);

    // Carregar configurações de zoom do usuário
    useEffect(() => {
        if (currentUser?.id) {
            loadZoomSettings();
        }
    }, [currentUser?.id]);

    const loadZoomSettings = async () => {
        try {
            setIsLoading(true);
            const settings = await api.getZoomSettings(currentUser.id);
            if (settings) {
                setZoomLevel(settings.zoomLevel);
            }
        } catch (error) {
            console.error('Erro ao carregar configurações de zoom:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const applyZoomToDocument = (level: number) => {
        // Aplicar zoom ao documento inteiro
        const zoomFactor = level / 100;
        document.documentElement.style.transform = `scale(${zoomFactor})`;
        document.documentElement.style.transformOrigin = 'top left';
        document.documentElement.style.width = `${100 / zoomFactor}%`;
        document.documentElement.style.height = `${100 / zoomFactor}%`;
        document.documentElement.style.overflow = 'hidden';
    };

    const updateZoom = async (newLevel: number) => {
        try {
            setIsLoading(true);
            setZoomLevel(newLevel);
            
            // Atualizar no backend
            await api.updateZoomSettings(currentUser.id, newLevel);
            
            // Aplicar zoom ao documento
            applyZoomToDocument(newLevel);
            
        } catch (error) {
            console.error('Erro ao atualizar zoom:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const increaseZoom = () => {
        const newLevel = Math.min(zoomLevel + 10, 150);
        updateZoom(newLevel);
    };

    const decreaseZoom = () => {
        const newLevel = Math.max(zoomLevel - 10, 50);
        updateZoom(newLevel);
    };

    const resetZoom = async () => {
        try {
            setIsLoading(true);
            
            // Resetar no backend
            await api.resetZoomSettings(currentUser.id);
            
            // Resetar localmente
            setZoomLevel(100);
            applyZoomToDocument(100);
            
        } catch (error) {
            console.error('Erro ao resetar zoom:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newLevel = parseInt(e.target.value);
        updateZoom(newLevel);
    };

    return (
        <div className="flex flex-col h-full bg-[#1a1c2e]">
            <header className="flex items-center p-4 flex-shrink-0">
                <button onClick={onBack} className="absolute"><BackIcon className="w-6 h-6" /></button>
                <div className="flex-grow text-center"><h1 className="text-xl font-bold">{t('settings.zoom.title')}</h1></div>
            </header>
            <main className="flex-grow flex flex-col justify-center items-center text-center p-8 space-y-8">
                <div className="flex-grow flex flex-col justify-center items-center">
                    <h2 className="text-8xl font-bold">{zoomLevel}%</h2>
                    <p className="text-gray-400 mt-2">{t('settings.zoom.current')}</p>
                    {isLoading && <p className="text-blue-400 text-sm mt-1">Atualizando...</p>}
                </div>

                <div className="w-full max-w-sm bg-[#2C2C2E] p-6 rounded-2xl space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>{t('settings.zoom.small')}</span>
                            <span>{t('settings.zoom.large')}</span>
                        </div>
                        <input
                            type="range"
                            min="50"
                            max="150"
                            step="10"
                            value={zoomLevel}
                            onChange={handleSliderChange}
                            disabled={isLoading}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
                        />
                    </div>
                    <div className="flex items-center justify-center space-x-6">
                        <button 
                            onClick={decreaseZoom} 
                            disabled={isLoading || zoomLevel <= 50}
                            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <MinusCircleIcon className="w-10 h-10" />
                        </button>
                        <button 
                            onClick={resetZoom} 
                            disabled={isLoading}
                            className="bg-gray-600 text-white font-semibold px-8 py-2 rounded-full hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('settings.zoom.reset')}
                        </button>
                        <button 
                            onClick={increaseZoom} 
                            disabled={isLoading || zoomLevel >= 150}
                            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <PlusCircleIcon className="w-10 h-10" />
                        </button>
                    </div>
                </div>

                <p className="text-sm text-gray-400 max-w-xs">
                    {t('settings.zoom.description')}
                </p>
            </main>
        </div>
    );
};

export default ZoomSettingsScreen;