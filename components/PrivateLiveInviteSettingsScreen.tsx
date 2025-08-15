
import React, { useState, useEffect } from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ToggleSwitch from './ToggleSwitch';
import type { User, PrivateLiveInviteSettings } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import { useApiViewer } from './ApiContext';

interface PrivateLiveInviteSettingsScreenProps {
    user: User;
    onExit: () => void;
}

const SettingItem: React.FC<{ label: string; description?: string; children: React.ReactNode }> = ({ label, description, children }) => (
    <div className="px-4 py-3 flex justify-between items-center">
        <div className="pr-4">
            <span className="text-white text-base">{label}</span>
            {description && <p className="text-xs text-gray-400 mt-1 max-w-xs">{description}</p>}
        </div>
        <div>{children}</div>
    </div>
);


const PrivateLiveInviteSettingsScreen: React.FC<PrivateLiveInviteSettingsScreenProps> = ({ user, onExit }) => {
    const [settings, setSettings] = useState<Omit<PrivateLiveInviteSettings, 'userId'>>({
        privateInvites: true,
        onlyFollowing: true,
        onlyFans: false,
        onlyFriends: false,
    });
    const [isLoading, setIsLoading] = useState(true);
    const { showApiResponse } = useApiViewer();

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const data = await liveStreamService.getPrivateLiveInviteSettings(user.id);
                showApiResponse(`GET /api/users/${user.id}/private-live-invite-settings`, data);
                setSettings({
                    privateInvites: data.privateInvites,
                    onlyFollowing: data.onlyFollowing,
                    onlyFans: data.onlyFans,
                    onlyFriends: data.onlyFriends,
                });
            } catch (error) {
                console.error("Failed to load settings:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [user.id, showApiResponse]);

    const handleSettingChange = async (key: keyof typeof settings, value: boolean) => {
        const oldSettings = { ...settings };
        const newSettings = { ...settings, [key]: value };
        
        setSettings(newSettings);

        try {
            const updatedSettings = await liveStreamService.updatePrivateLiveInviteSettings(user.id, { [key]: value });
            showApiResponse(`PUT /api/users/${user.id}/private-live-invite-settings`, updatedSettings);
            setSettings({
                privateInvites: updatedSettings.privateInvites,
                onlyFollowing: updatedSettings.onlyFollowing,
                onlyFans: updatedSettings.onlyFans,
                onlyFriends: updatedSettings.onlyFriends,
            });
        } catch (error) {
            console.error("Failed to save setting:", error);
            setSettings(oldSettings);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex-grow flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
            );
        }

        return (
            <div className="bg-[#2c2c2e]/50 divide-y divide-gray-700/50 rounded-lg mx-4">
                <SettingItem label="Convite privado ao vivo" description="Você receberá um convite privado ao vivo quando o ligar">
                    <ToggleSwitch enabled={settings.privateInvites} onChange={(value) => handleSettingChange('privateInvites', value)} ariaLabel="Convite privado ao vivo" />
                </SettingItem>
                 <SettingItem label="Após a abertura, só aceito usuários que sigo.">
                    <ToggleSwitch enabled={settings.onlyFollowing} onChange={(value) => handleSettingChange('onlyFollowing', value)} ariaLabel="Aceitar apenas usuários seguidos" />
                </SettingItem>
                <SettingItem label="Após a abertura, apenas meus fãs são aceitos.">
                    <ToggleSwitch enabled={settings.onlyFans} onChange={(value) => handleSettingChange('onlyFans', value)} ariaLabel="Aceitar apenas fãs" />
                </SettingItem>
                 <SettingItem label="Após a abertura, só aceito meus amigos.">
                    <ToggleSwitch enabled={settings.onlyFriends} onChange={(value) => handleSettingChange('onlyFriends', value)} ariaLabel="Aceitar apenas amigos" />
                </SettingItem>
             </div>
        );
    };

    return (
        <div className="h-screen w-full bg-[#1c1c1c] text-white flex flex-col font-sans">
            <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-700/50 relative">
                <button onClick={onExit} className="p-2 -m-2 z-10">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="font-semibold text-lg absolute left-1/2 -translate-x-1/2 whitespace-nowrap">Convite privado ao vivo</h1>
                <div className="w-6 h-6"></div>
            </header>
            <main className="flex-grow overflow-y-auto pt-4">
                 {renderContent()}
            </main>
        </div>
    );
};

export default PrivateLiveInviteSettingsScreen;
