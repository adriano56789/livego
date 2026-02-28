
import React, { useState, useEffect } from 'react';
import { BackIcon, ChevronRightIcon } from '../icons';
import { useTranslation } from '../../i18n';
import { User, NotificationSettings } from '../../types';
import { api } from '../../services/api';
import { LoadingSpinner } from '../Loading';

const SettingsToggle: React.FC<{ label: string; isEnabled: boolean; onToggle: () => void; }> = ({ label, isEnabled, onToggle }) => (
    <div className="flex items-center justify-between w-full p-4 bg-[#1C1C1E]">
        <span className="text-white text-base">{label}</span>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={isEnabled} onChange={onToggle} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
    </div>
);

interface NotificationSettingsScreenProps {
    onBack: () => void;
    navigateTo: (page: string) => void;
    currentUser: User;
}

const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({ onBack, navigateTo, currentUser }) => {
    const { t } = useTranslation();
    const [toggles, setToggles] = useState<NotificationSettings | null>(null);

    useEffect(() => {
        if (currentUser) {
            api.getNotificationSettings(currentUser.id)
                .then(setToggles)
                .catch(err => {
                    console.error("Failed to load notification settings:", err);
                    // Set to default values on error to prevent UI from being stuck in loading
                    setToggles({
                        newMessages: false,
                        streamerLive: false,
                        followedPosts: false,
                        pedido: false,
                        interactive: false,
                    });
                });
        }
    }, [currentUser]);

    const handleToggle = (key: keyof NotificationSettings) => {
        if (!currentUser || !toggles) return;
        
        const newToggles = { ...toggles, [key]: !toggles[key] };
        setToggles(newToggles); // Optimistic UI update

        api.updateNotificationSettings(currentUser.id, { [key]: newToggles[key] })
            .catch(() => {
                // Revert on failure
                setToggles(toggles);
            });
    };

    return (
        <div className="flex flex-col h-full bg-black">
            <header className="flex items-center p-4 flex-shrink-0">
                <button onClick={onBack} className="absolute"><BackIcon className="w-6 h-6" /></button>
                <div className="flex-grow text-center"><h1 className="text-xl font-bold">{t('settings.notifications.title')}</h1></div>
            </header>
            <main className="flex-grow overflow-y-auto no-scrollbar pt-2">
                {!toggles ? (
                    <div className="flex justify-center items-center h-full">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <>
                        <div className="px-4 py-2 text-gray-400 text-sm">{t('settings.notifications.receive')}</div>
                        <div className="space-y-px">
                            <SettingsToggle label={t('settings.notifications.newMessages')} isEnabled={toggles.newMessages} onToggle={() => handleToggle('newMessages')} />
                            <SettingsToggle label={t('settings.notifications.streamerLive')} isEnabled={toggles.streamerLive} onToggle={() => handleToggle('streamerLive')} />
                            <button onClick={() => navigateTo('push_settings')} className="flex items-center justify-between w-full p-4 bg-[#1C1C1E] hover:bg-gray-800/50 transition-colors">
                                <span className="text-white text-base">{t('settings.notifications.pushSettings')}</span>
                                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                            </button>
                            <SettingsToggle label={t('settings.notifications.followedPosts')} isEnabled={toggles.followedPosts} onToggle={() => handleToggle('followedPosts')} />
                        </div>

                        <div className="px-4 py-2 mt-4 text-gray-400 text-sm">{t('settings.notifications.interactive')}</div>
                        <div className="space-y-px">
                            <SettingsToggle label={t('settings.notifications.request')} isEnabled={toggles.pedido} onToggle={() => handleToggle('pedido')} />
                            <SettingsToggle label={t('settings.notifications.interactive')} isEnabled={toggles.interactive} onToggle={() => handleToggle('interactive')} />
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default NotificationSettingsScreen;
