import React, { useState, useEffect } from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ToggleSwitch from './ToggleSwitch';
import type { User, PrivacySettings } from '../types';
import { getPrivacySettings, updatePrivacySettings } from '../services/liveStreamService';
import { useApiViewer } from './ApiContext';

interface PrivacySettingsScreenProps {
    user: User;
    onExit: () => void;
}

const SettingRow: React.FC<{
    title: string;
    description: string;
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
    ariaLabel: string;
}> = ({ title, description, enabled, onToggle, ariaLabel }) => (
    <div className="flex justify-between items-center py-4 border-b border-gray-800/50">
        <div>
            <h3 className="text-white text-base font-medium">{title}</h3>
            <p className="text-gray-400 text-sm mt-1">{description}</p>
        </div>
        <ToggleSwitch enabled={enabled} onChange={onToggle} ariaLabel={ariaLabel} />
    </div>
);


const PrivacySettingsScreen: React.FC<PrivacySettingsScreenProps> = ({ user, onExit }) => {
    const [settings, setSettings] = useState<Omit<PrivacySettings, 'userId'> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { showApiResponse } = useApiViewer();

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const data = await getPrivacySettings(user.id);
                showApiResponse(`GET /api/users/${user.id}/privacy-settings`, data);
                setSettings(data);
            } catch (error) {
                console.error("Failed to load privacy settings:", error);
                setSettings({ showLocation: true, showActiveStatus: true, showInNearby: true });
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [user.id, showApiResponse]);

    const handleSettingChange = async (key: keyof Omit<PrivacySettings, 'userId'>, value: boolean) => {
        if (!settings) return;

        const oldSettings = { ...settings };
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        try {
            const updatedSettings = await updatePrivacySettings(user.id, { [key]: value });
            showApiResponse(`PATCH /api/users/${user.id}/privacy-settings`, updatedSettings);
            setSettings(updatedSettings);
        } catch (error) {
            console.error("Failed to update setting:", error);
            setSettings(oldSettings); // Revert on failure
        }
    };
    
    if (isLoading) {
        return (
             <div className="h-screen w-full bg-[#1c1c1c] text-white flex flex-col font-sans">
                <header className="p-4 flex items-center shrink-0 border-b border-gray-800/50 relative">
                    <button onClick={onExit} className="p-2 -m-2 z-10"><ArrowLeftIcon className="w-6 h-6" /></button>
                    <h1 className="font-semibold text-lg absolute left-1/2 -translate-x-1/2 whitespace-nowrap">Configuração de privacidade</h1>
                </header>
                <main className="flex-grow flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </main>
            </div>
        );
    }


    return (
        <div className="h-screen w-full bg-[#1c1c1c] text-white flex flex-col font-sans">
            <header className="p-4 flex items-center shrink-0 border-b border-gray-800/50 relative">
                <button onClick={onExit} className="p-2 -m-2 z-10"><ArrowLeftIcon className="w-6 h-6" /></button>
                <h1 className="font-semibold text-lg absolute left-1/2 -translate-x-1/2 whitespace-nowrap">Configuração de privacidade</h1>
            </header>
            <main className="flex-grow px-4 py-2">
                {settings && (
                    <>
                        <SettingRow
                            title="Mostrar local"
                            description="Desligar irá esconder sua localização de outros"
                            enabled={settings.showLocation}
                            onToggle={(value) => handleSettingChange('showLocation', value)}
                            ariaLabel="Mostrar localização"
                        />
                        <SettingRow
                            title="Mostrar estado ativo"
                            description="Desligar a atividade de esconder de outros"
                            enabled={settings.showActiveStatus}
                            onToggle={(value) => handleSettingChange('showActiveStatus', value)}
                            ariaLabel="Mostrar estado ativo"
                        />
                        <SettingRow
                            title="Mostrar em [Pessoas próximas]"
                            description="Desligar irá tornar impossível para as pessoas próximas procurarem por você"
                            enabled={settings.showInNearby}
                            onToggle={(value) => handleSettingChange('showInNearby', value)}
                            ariaLabel="Mostrar em Pessoas Próximas"
                        />
                    </>
                )}
            </main>
        </div>
    );
};

export default PrivacySettingsScreen;
