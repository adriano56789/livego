
import React, { useState, useEffect } from 'react';
import { BackIcon } from '../icons';
import { useTranslation } from '../../i18n';
import { User, ToastType } from '../../types';
import { api } from '../../services/api';
import { LoadingSpinner } from '../Loading';

const SettingsToggle: React.FC<{ label: string; description?: string; isEnabled: boolean; onToggle: () => void; }> = ({ label, description, isEnabled, onToggle }) => (
    <div className="flex items-center justify-between w-full p-4 bg-[#1C1C1E]">
        <div>
            <p className="text-white text-base">{label}</p>
            {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
        </div>
        <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
            <input type="checkbox" checked={isEnabled} onChange={onToggle} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
    </div>
);

interface PrivateLiveSettingsScreenProps {
    onBack: () => void;
    currentUser: User;
    updateUser: (user: User) => void;
    addToast: (type: ToastType, message: string) => void;
}

const PrivateLiveSettingsScreen: React.FC<PrivateLiveSettingsScreenProps> = ({ onBack, currentUser, updateUser, addToast }) => {
    const { t } = useTranslation();
    const [toggles, setToggles] = useState<User['privateStreamSettings'] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        api.getPrivateStreamSettings(currentUser.id)
            .then(data => {
                setToggles(data.settings || { privateInvite: true, followersOnly: true, fansOnly: false, friendsOnly: false });
            })
            .catch(() => {
                addToast(ToastType.Error, "Falha ao carregar configurações.");
                setToggles({ privateInvite: true, followersOnly: true, fansOnly: false, friendsOnly: false });
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [currentUser.id, addToast]);

    const handleToggle = (key: keyof NonNullable<User['privateStreamSettings']>) => {
        if (!toggles) return;

        const newToggles = { ...toggles, [key]: !toggles[key] };
        setToggles(newToggles); // Optimistic update

        api.updatePrivateStreamSettings(currentUser.id, { [key]: newToggles[key] })
            .then(response => {
                if (response.success && response.user) {
                    updateUser(response.user);
                    addToast(ToastType.Success, 'Configuração salva!');
                } else {
                    throw new Error(); // Trigger catch block to revert
                }
            })
            .catch(() => {
                setToggles(toggles); // Revert on failure
                addToast(ToastType.Error, "Falha ao salvar a configuração.");
            });
    };

    return (
        <div className="flex flex-col h-full bg-black">
            <header className="flex items-center p-4 flex-shrink-0">
                <button onClick={onBack} className="absolute"><BackIcon className="w-6 h-6" /></button>
                <div className="flex-grow text-center"><h1 className="text-xl font-bold">{t('settings.privateLive.title')}</h1></div>
            </header>
            <main className="flex-grow overflow-y-auto no-scrollbar pt-2">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <LoadingSpinner />
                    </div>
                ) : toggles ? (
                    <div className="space-y-px">
                        <SettingsToggle 
                            label={t('settings.privateLive.mainToggleLabel')} 
                            description={t('settings.privateLive.mainToggleDesc')}
                            isEnabled={toggles.privateInvite} 
                            onToggle={() => handleToggle('privateInvite')} 
                        />
                        <SettingsToggle 
                            label={t('settings.privateLive.followersOnly')} 
                            isEnabled={toggles.followersOnly} 
                            onToggle={() => handleToggle('followersOnly')} 
                        />
                        <SettingsToggle 
                            label={t('settings.privateLive.fansOnly')}
                            isEnabled={toggles.fansOnly} 
                            onToggle={() => handleToggle('fansOnly')} 
                        />
                        <SettingsToggle 
                            label={t('settings.privateLive.friendsOnly')} 
                            isEnabled={toggles.friendsOnly} 
                            onToggle={() => handleToggle('friendsOnly')} 
                        />
                    </div>
                ) : (
                    <div className="text-center text-gray-500 pt-10">Não foi possível carregar as configurações.</div>
                )}
            </main>
        </div>
    );
};

export default PrivateLiveSettingsScreen;