
import React, { useState, useEffect } from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ToggleSwitch from './ToggleSwitch';
import type { AppView, User, NotificationSettings } from '../types';
import { getNotificationSettings, updateNotificationSettings } from '../services/liveStreamService';
import { useApiViewer } from './ApiContext';

interface NotificationSettingsScreenProps {
    user: User;
    onExit: () => void;
    onNavigate: (view: AppView) => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h2 className="px-4 pt-6 pb-2 text-sm text-gray-400">{title}</h2>
        <div className="bg-[#2c2c2e]/50 divide-y divide-gray-700/50 rounded-lg">
            {children}
        </div>
    </div>
);

const SettingItem: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="px-4 py-3 flex justify-between items-center">
        <span className="text-white text-base">
            {label}
        </span>
        <div>{children}</div>
    </div>
);


const NavItem: React.FC<{ label: string; onClick: () => void; }> = ({ label, onClick }) => (
    <button onClick={onClick} className="w-full px-4 py-3 flex justify-between items-center text-left">
        <span className="text-white text-base">{label}</span>
        <span className="text-gray-500 text-xl font-semibold">&gt;</span>
    </button>
)

const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({ user, onExit, onNavigate }) => {
    const [settings, setSettings] = useState<Omit<NotificationSettings, 'userId'> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { showApiResponse } = useApiViewer();

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const data = await getNotificationSettings(user.id);
                showApiResponse(`GET /api/users/${user.id}/notification-settings`, data);
                setSettings(data);
            } catch (error) {
                console.error("Failed to load notification settings:", error);
                setSettings({
                    newMessages: true,
                    streamerLive: true,
                    followedPost: true,
                    order: true,
                    interactive: true,
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [user.id, showApiResponse]);
    
    const handleSettingChange = async (key: keyof Omit<NotificationSettings, 'userId'>, value: boolean) => {
        if (!settings) return;

        const oldSettings = { ...settings };
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        try {
            const updatedSettings = await updateNotificationSettings(user.id, { [key]: value });
            showApiResponse(`PATCH /api/users/${user.id}/notification-settings`, updatedSettings);
            setSettings(updatedSettings);
        } catch (error) {
            console.error("Failed to update setting:", error);
            setSettings(oldSettings);
        }
    };

    if (isLoading) {
        return (
             <div className="h-screen w-full bg-[#1c1c1c] text-white flex flex-col font-sans">
                <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-700/50 relative">
                    <button onClick={onExit} className="p-2 -m-2 z-10"><ArrowLeftIcon className="w-6 h-6" /></button>
                    <h1 className="font-semibold text-lg absolute left-1/2 -translate-x-1/2 whitespace-nowrap">Configurações de notificação</h1>
                    <div className="w-6 h-6"></div>
                </header>
                <main className="flex-grow flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </main>
            </div>
        );
    }
    
    return (
        <div className="h-screen w-full bg-[#1c1c1c] text-white flex flex-col font-sans">
            <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-700/50 relative">
                <button onClick={onExit} className="p-2 -m-2 z-10"><ArrowLeftIcon className="w-6 h-6" /></button>
                <h1 className="font-semibold text-lg absolute left-1/2 -translate-x-1/2 whitespace-nowrap">Configurações de notificação</h1>
                <div className="w-6 h-6"></div>
            </header>
            <main className="flex-grow overflow-y-auto px-4">
                <Section title="Receber notificações">
                    <SettingItem label="Novas mensagens">
                        <ToggleSwitch enabled={settings?.newMessages ?? true} onChange={(v) => handleSettingChange('newMessages', v)} ariaLabel="Novas mensagens" />
                    </SettingItem>
                    <SettingItem label="Início ao vivo do streamer seguido">
                         <ToggleSwitch enabled={settings?.streamerLive ?? true} onChange={(v) => handleSettingChange('streamerLive', v)} ariaLabel="Início ao vivo do streamer seguido" />
                    </SettingItem>
                     <NavItem label="Iniciar configurações de push" onClick={() => onNavigate('push-settings')} />
                    <SettingItem label="Pessoa seguida postou um vídeo LiveGo">
                        <ToggleSwitch enabled={settings?.followedPost ?? true} onChange={(v) => handleSettingChange('followedPost', v)} ariaLabel="Pessoa seguida postou um vídeo LiveGo" />
                    </SettingItem>
                </Section>

                <Section title="Notificações interativas">
                     <SettingItem label="Pedido">
                        <ToggleSwitch enabled={settings?.order ?? true} onChange={(v) => handleSettingChange('order', v)} ariaLabel="Pedido" />
                    </SettingItem>
                    <SettingItem label="Notificações interativas">
                         <ToggleSwitch enabled={settings?.interactive ?? true} onChange={(v) => handleSettingChange('interactive', v)} ariaLabel="Notificações interativas" />
                    </SettingItem>
                </Section>
            </main>
        </div>
    );
};

export default NotificationSettingsScreen;
