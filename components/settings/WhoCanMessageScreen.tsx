import React, { useState, useEffect } from 'react';
import { BackIcon, CheckIcon } from '../icons';
import { useTranslation } from '../../i18n';
import { User, ToastType } from '../../types';
import { api } from '../../services/api';
import { LoadingSpinner } from '../Loading';

type MessagePreference = 'all' | 'followers' | 'none';

interface WhoCanMessageScreenProps {
    onBack: () => void;
    currentUser: User;
    updateUser: (user: User) => void;
    addToast: (type: ToastType, message: string) => void;
}

const WhoCanMessageScreen: React.FC<WhoCanMessageScreenProps> = ({ onBack, currentUser, updateUser, addToast }) => {
    const { t } = useTranslation();
    const [preference, setPreference] = useState<MessagePreference | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        api.getChatPermissionStatus(currentUser.id)
            .then(data => {
                setPreference(data.permission);
            })
            .catch(() => {
                addToast(ToastType.Error, "Falha ao carregar configuração de mensagens.");
                setPreference('all'); // fallback
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [currentUser.id, addToast]);

    const handleSave = async () => {
        if (!preference || preference === currentUser.chatPermission) {
            onBack();
            return;
        };

        const originalUser = { ...currentUser };
        updateUser({ ...currentUser, chatPermission: preference });

        try {
            const { success, user } = await api.updateChatPermission(currentUser.id, preference);
            if (success && user) {
                updateUser(user);
                addToast(ToastType.Success, "Configuração de mensagem salva!");
                onBack();
            } else {
                throw new Error("Falha ao salvar configuração.");
            }
        } catch (error) {
            updateUser(originalUser);
            addToast(ToastType.Error, (error as Error).message);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black">
            <header className="flex items-center justify-between p-4 flex-shrink-0">
                <button onClick={onBack}><BackIcon className="w-6 h-6" /></button>
                <h1 className="text-xl font-bold">{t('settings.whoCanMessageScreen.title')}</h1>
                <button onClick={handleSave} className="font-semibold text-lg text-purple-400">{t('common.save')}</button>
            </header>
            <main className="flex-grow overflow-y-auto no-scrollbar pt-2">
                {isLoading || preference === null ? (
                    <div className="flex items-center justify-center h-full">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <div className="space-y-px">
                        <button onClick={() => setPreference('all')} className="w-full flex justify-between items-center p-4 bg-[#1C1C1E] text-left">
                            <div>
                                <p className="text-white">{t('settings.whoCanMessageScreen.everyone')}</p>
                            </div>
                            {preference === 'all' && <CheckIcon className="w-6 h-6 text-purple-400" />}
                        </button>
                         <button onClick={() => setPreference('followers')} className="w-full flex justify-between items-start p-4 bg-[#1C1C1E] text-left">
                            <div>
                                <p className="text-white">{t('settings.whoCanMessageScreen.followersOnly')}</p>
                                <p className="text-gray-400 text-sm mt-1">{t('settings.whoCanMessageScreen.followersOnlyDesc')}</p>
                            </div>
                            {preference === 'followers' && <CheckIcon className="w-6 h-6 text-purple-400 flex-shrink-0 ml-4" />}
                        </button>
                        <button onClick={() => setPreference('none')} className="w-full flex justify-between items-start p-4 bg-[#1C1C1E] text-left">
                            <div>
                                <p className="text-white">{t('settings.whoCanMessageScreen.none')}</p>
                                <p className="text-gray-400 text-sm mt-1">{t('settings.whoCanMessageScreen.noneDesc')}</p>
                            </div>
                            {preference === 'none' && <CheckIcon className="w-6 h-6 text-purple-400 flex-shrink-0 ml-4" />}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default WhoCanMessageScreen;
