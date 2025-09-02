

import React, { useState, useEffect } from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ToggleSwitch from './ToggleSwitch';
import type { User, PrivacySettings, AppView } from '../types';
import { getPrivacySettings, updatePrivacySettings } from '../services/liveStreamService';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface PrivacySettingsScreenProps {
    user: User;
    onExit: () => void;
    onNavigate: (view: AppView) => void;
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

const NavRow: React.FC<{ title: string; currentValue: string; onClick: () => void; }> = ({ title, currentValue, onClick }) => (
    <button onClick={onClick} className="w-full flex justify-between items-center py-4 border-b border-gray-800/50">
        <div>
            <h3 className="text-white text-base font-medium">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-gray-400">{currentValue}</span>
            <ChevronRightIcon className="w-5 h-5 text-gray-500" />
        </div>
    </button>
);


const PrivacySettingsScreen: React.FC<PrivacySettingsScreenProps> = ({ user, onExit, onNavigate }) => {
    const [settings, setSettings] = useState<Omit<PrivacySettings, 'userId'> | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const data = await getPrivacySettings(user.id);
                setSettings(data);
            } catch (error) {
                console.error("Failed to load privacy settings:", error);
                setSettings({ showLocation: true, showActiveStatus: true, showInNearby: true, protectionEnabled: false, messagePrivacy: 'everyone' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [user.id]);

    const handleSettingChange = async (key: keyof Omit<PrivacySettings, 'userId'>, value: boolean) => {
        if (!settings) return;

        const oldSettings = { ...settings };
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        try {
            const updatedSettings = await updatePrivacySettings(user.id, { [key]: value });
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

    const messagePrivacyLabel = settings?.messagePrivacy === 'everyone' ? 'Todos' : 'Apenas seguidores mútuos';

    return (
        <div className="h-screen w-full bg-[#1c1c1c] text-white flex flex-col font-sans">
            <header className="p-4 flex items-center shrink-0 border-b border-gray-800/50 relative">
                <button onClick={onExit} className="p-2 -m-2 z-10"><ArrowLeftIcon className="w-6 h-6" /></button>
                <h1 className="font-semibold text-lg absolute left-1/2 -translate-x-1/2 whitespace-nowrap">Configuração de privacidade</h1>
            </header>
            <main className="flex-grow px-4 py-2">
                {settings && (
                    <>
                        <NavRow
                            title="Quem pode me enviar mensagem"
                            currentValue={messagePrivacyLabel}
                            onClick={() => onNavigate('message-privacy-settings')}
                        />
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
                        <SettingRow
                            title="Proteção de Perfil"
                            description="Outros usuários verão um selo de 'Proteção ativada' em seu perfil."
                            enabled={settings.protectionEnabled}
                            onToggle={(value) => handleSettingChange('protectionEnabled', value)}
                            ariaLabel="Ativar Proteção de Perfil"
                        />
                    </>
                )}
            </main>
        </div>
    );
};

export default PrivacySettingsScreen;