import React from 'react';
import { BackIcon, ChevronRightIcon, EyeIcon } from '../icons';
import { useTranslation } from '../../i18n';
import { User, ToastType } from '../../types';
import { api } from '../../services/api';

const SettingsToggle: React.FC<{ label: string; description?: string; isEnabled: boolean; onToggle: () => void; icon?: React.ReactNode }> = ({ label, description, isEnabled, onToggle, icon }) => (
    <div className="flex items-center justify-between w-full p-4 bg-[#1C1C1E]">
        <div className="flex items-center space-x-3">
            {icon}
            <div>
                <p className="text-white text-base">{label}</p>
                {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
            </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
            <input type="checkbox" checked={isEnabled} onChange={onToggle} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
    </div>
);

interface PrivacySettingsScreenProps { 
    onBack: () => void; 
    navigateTo: (page: string) => void; 
    onOpenPipModal: () => void; 
    currentUser: User; 
    updateUser: (user: User) => void;
    addToast: (type: ToastType, message: string) => void;
}

const PrivacySettingsScreen: React.FC<PrivacySettingsScreenProps> = ({ onBack, navigateTo, onOpenPipModal, currentUser, updateUser, addToast }) => {
    const { t } = useTranslation();

    const handleToggleActiveStatus = async () => {
        const newVisibility = !(currentUser.showActivityStatus ?? true);
        const originalUser = { ...currentUser };
        updateUser({ ...currentUser, showActivityStatus: newVisibility, isOnline: newVisibility });

        try {
            const { success, user } = await api.updateActivityPreference(currentUser.id, newVisibility);
            if (success && user) {
                updateUser(user);
                addToast(ToastType.Success, "Status de atividade atualizado.");
            } else {
                throw new Error("Falha ao atualizar status de atividade.");
            }
        } catch (error) {
            updateUser(originalUser);
            addToast(ToastType.Error, (error as Error).message);
        }
    };

    const handleToggleLocationVisibility = async () => {
        const newVisibility = !(currentUser.showLocation ?? true);
        const originalUser = { ...currentUser };
        updateUser({ ...currentUser, showLocation: newVisibility });

        try {
            const { success, user } = await api.updateLocationVisibility(currentUser.id, newVisibility);
            if (success && user) {
                updateUser(user);
                addToast(ToastType.Success, "Visibilidade da localização atualizada.");
            } else {
                throw new Error("Falha ao atualizar visibilidade da localização.");
            }
        } catch (error) {
            updateUser(originalUser);
            addToast(ToastType.Error, (error as Error).message);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black">
            <header className="flex items-center p-4 flex-shrink-0">
                <button onClick={onBack} className="absolute"><BackIcon className="w-6 h-6" /></button>
                <div className="flex-grow text-center"><h1 className="text-xl font-bold">{t('settings.privacy.title')}</h1></div>
            </header>
            <main className="flex-grow overflow-y-auto no-scrollbar pt-2">
                 <div className="space-y-px">
                    <button onClick={() => navigateTo('who_can_message')} className="flex items-center justify-between w-full p-4 bg-[#1C1C1E] hover:bg-gray-800/50 transition-colors">
                        <span className="text-white text-base">{t('settings.privacy.whoCanMessage')}</span>
                        <div className="flex items-center space-x-2">
                            <span className="text-gray-400">{currentUser.chatPermission === 'followers' ? t('common.followers') : (currentUser.chatPermission === 'none' ? t('settings.whoCanMessageScreen.none') : t('common.all'))}</span>
                            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                        </div>
                    </button>
                    <SettingsToggle 
                        label={t('settings.privacy.showLocation')}
                        description={t('settings.privacy.showLocationDesc')}
                        isEnabled={currentUser.showLocation ?? true}
                        onToggle={handleToggleLocationVisibility}
                    />
                    <SettingsToggle 
                        label={t('settings.privacy.showActive')}
                        description={t('settings.privacy.showActiveDesc')}
                        isEnabled={currentUser.showActivityStatus ?? true}
                        onToggle={handleToggleActiveStatus}
                    />
                    <button onClick={onOpenPipModal} className="flex items-center justify-between w-full p-4 bg-[#1C1C1E] hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center space-x-3">
                            <EyeIcon className="w-6 h-6 text-gray-400" />
                            <div>
                                <p className="text-white text-base">{t('settings.privacy.pip')}</p>
                                <p className="text-gray-400 text-sm mt-1">{t('settings.privacy.pipDesc')}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-gray-400">{currentUser.pipEnabled ? t('settings.privacy.pipStatusEnabled') : t('settings.privacy.pipStatusDisabled')}</span>
                            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                        </div>
                    </button>
                 </div>
            </main>
        </div>
    );
};

export default PrivacySettingsScreen;
