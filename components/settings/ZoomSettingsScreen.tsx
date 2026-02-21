
import React, { useState } from 'react';
import { BackIcon, MinusCircleIcon, PlusCircleIcon } from '../icons';
import { useTranslation } from '../../i18n';

const ZoomSettingsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { t } = useTranslation();
    const [zoomLevel, setZoomLevel] = useState(90);

    const increaseZoom = () => setZoomLevel(prev => Math.min(prev + 10, 150));
    const decreaseZoom = () => setZoomLevel(prev => Math.max(prev - 10, 50));
    const resetZoom = () => setZoomLevel(100);

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
                            onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                    <div className="flex items-center justify-center space-x-6">
                        <button onClick={decreaseZoom} className="text-gray-400 hover:text-white transition-colors">
                            <MinusCircleIcon className="w-10 h-10" />
                        </button>
                        <button onClick={resetZoom} className="bg-gray-600 text-white font-semibold px-8 py-2 rounded-full hover:bg-gray-500 transition-colors">
                            {t('settings.zoom.reset')}
                        </button>
                        <button onClick={increaseZoom} className="text-gray-400 hover:text-white transition-colors">
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