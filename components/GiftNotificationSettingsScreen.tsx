
import React, { useState, useEffect } from 'react';
import type { User, Gift, GiftNotificationSettings as Settings } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ToggleSwitch from './ToggleSwitch';
import DiamondIcon from './icons/DiamondIcon';

interface GiftNotificationSettingsScreenProps {
  user: User;
  onExit: () => void;
  onUpdateSettings: (newSettings: Record<number, boolean>) => void;
}

const GiftNotificationSettingsScreen: React.FC<GiftNotificationSettingsScreenProps> = ({ user, onExit, onUpdateSettings }) => {
    const [settings, setSettings] = useState<Record<number, boolean>>({});
    const [gifts, setGifts] = useState<Gift[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [giftsData, settingsData] = await Promise.all([
                    liveStreamService.getGiftCatalog(),
                    liveStreamService.getGiftNotificationSettings(user.id)
                ]);
                setGifts(giftsData);
                setSettings(settingsData.enabledGifts);
            } catch (error) {
                console.error("Failed to load data for gift settings screen", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user.id]);

    const handleToggleChange = async (giftId: number, isEnabled: boolean) => {
        const oldSettings = { ...settings };
        const newSettings = { ...settings, [giftId]: isEnabled };
        setSettings(newSettings);

        try {
            const updatedSettings = await liveStreamService.updateGiftNotificationSetting(user.id, giftId, isEnabled);
            setSettings(updatedSettings.enabledGifts);
            onUpdateSettings(updatedSettings.enabledGifts); // Update parent state
        } catch (error) {
            console.error("Failed to update gift notification setting:", error);
            setSettings(oldSettings); // Revert on failure
        }
    };
    
    return (
        <div className="h-screen w-full bg-[#1c1c1c] text-white flex flex-col font-sans">
            <header className="p-4 flex items-center shrink-0 border-b border-gray-700/50 relative">
                <button onClick={onExit} className="p-2 -m-2 z-10"><ArrowLeftIcon className="w-6 h-6" /></button>
                <h1 className="font-semibold text-lg absolute left-1/2 -translate-x-1/2 whitespace-nowrap">Configuração de Notificação de Presentes</h1>
            </header>
            <main className="flex-grow overflow-y-auto scrollbar-hide">
                 <p className="px-4 py-3 text-sm text-gray-400">
                    Controle quais notificações de presente aparecerão na tela durante uma transmissão.
                </p>
                {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-700/50">
                        {gifts.map(gift => (
                             <div key={gift.id} className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img src={gift.imageUrl} alt={gift.name} className="w-12 h-12 object-contain" />
                                    <div>
                                        <p className="font-semibold text-white">{gift.name}</p>
                                        <div className="flex items-center gap-1 text-xs text-yellow-400">
                                            <DiamondIcon className="w-3 h-3"/>
                                            <span>{gift.price}</span>
                                        </div>
                                    </div>
                                </div>
                                <ToggleSwitch
                                    enabled={settings[gift.id] ?? true} // Default to true if not set
                                    onChange={(isEnabled) => handleToggleChange(gift.id, isEnabled)}
                                    ariaLabel={`Notificações para ${gift.name}`}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default GiftNotificationSettingsScreen;
