import React, { useState } from 'react';
import { ChevronLeftIcon, CheckIcon } from '../icons';
import { User, ToastType } from '../../types';
import { api } from '../../services/api';
import { useTranslation } from '../../i18n';

interface WhoCanMessageScreenProps {
    onBack: () => void;
    currentUser: User;
    updateUser: (user: User) => void;
    addToast: (type: ToastType, message: string) => void;
}

const WhoCanMessageScreen: React.FC<WhoCanMessageScreenProps> = ({ onBack, currentUser, updateUser, addToast }) => {
    const { t } = useTranslation();
    const [isUpdating, setIsUpdating] = useState(false);
    
    type ChatPermission = 'all' | 'followers' | 'none';
    
    const options: { key: ChatPermission; label: string }[] = [
        { key: 'all', label: t('privacy.all') },
        { key: 'followers', label: t('privacy.followersOnly') },
        { key: 'none', label: t('privacy.none') }
    ];

    const currentPermission = currentUser.chatPermission || 'all';

    const handleSelect = async (permission: ChatPermission) => {
        if (isUpdating || currentPermission === permission) return;

        setIsUpdating(true);
        try {
            const { success, user } = await api.users.update('me', { chatPermission: permission });
            if (success && user) {
                updateUser(user);
                addToast(ToastType.Success, 'Preferência de chat atualizada!');
                onBack(); // Go back after success
            } else {
                throw new Error('Failed to update settings');
            }
        } catch (error) {
            addToast(ToastType.Error, 'Não foi possível salvar a alteração.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
         <div className="absolute inset-0 bg-[#121212] flex flex-col z-[160] animate-in slide-in-from-right duration-200 overflow-hidden select-text">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-white/5">
                <button onClick={onBack} className="p-1 -ml-1">
                    <ChevronLeftIcon className="w-6 h-6 text-white" />
                </button>
                <div className="flex-grow text-center mr-6">
                    <h1 className="text-lg font-bold text-white">{t('privacy.whoCanMessageMe')}</h1>
                </div>
            </header>
            <div className="pt-2">
                {options.map(opt => (
                    <button 
                        key={opt.key} 
                        onClick={() => handleSelect(opt.key)}
                        disabled={isUpdating}
                        className="flex items-center justify-between px-4 py-4 border-b border-white/5 w-full hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                        <span className={`text-white ${currentPermission === opt.key ? 'font-bold' : ''}`}>{opt.label}</span>
                        {currentPermission === opt.key && <CheckIcon className="w-5 h-5 text-purple-500" />}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default WhoCanMessageScreen;
