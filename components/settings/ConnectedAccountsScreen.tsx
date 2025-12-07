
import React, { useState, useEffect } from 'react';
import { BackIcon } from '../icons';
import { useTranslation } from '../../i18n';
import { GoogleAccount, User, ToastType } from '../../types';
import { api } from '../../services/api';
import { LoadingSpinner } from '../Loading';

interface ConnectedAccountsScreenProps {
  onBack: () => void;
  currentUser: User;
  addToast: (type: ToastType, message: string) => void;
  onLogout: () => void;
}

const ConnectedAccountsScreen: React.FC<ConnectedAccountsScreenProps> = ({ onBack, currentUser, addToast, onLogout }) => {
    const { t } = useTranslation();
    const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAccounts = React.useCallback(() => {
        setIsLoading(true);
        api.getConnectedGoogleAccounts()
            .then(data => setAccounts(data || []))
            .catch(err => {
                console.error(err);
                addToast(ToastType.Error, "Falha ao carregar contas conectadas.");
            })
            .finally(() => setIsLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const handleDisconnect = async (account: GoogleAccount) => {
        try {
            const { success } = await api.disconnectGoogleAccount(account.email);
            if (success) {
                addToast(ToastType.Success, "Conta desconectada com sucesso.");
                onLogout();
            } else {
                throw new Error("Falha ao desconectar conta.");
            }
        } catch (error) {
            addToast(ToastType.Error, (error as Error).message);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black">
            <header className="flex items-center p-4 flex-shrink-0">
                <button onClick={onBack} className="absolute"><BackIcon className="w-6 h-6" /></button>
                <div className="flex-grow text-center"><h1 className="text-xl font-bold">{t('settings.connected.title')}</h1></div>
                 <div className="w-6 h-6"></div>
            </header>
            <main className="flex-grow p-4 space-y-6">
                <p className="text-gray-400">{t('settings.connected.description')}</p>
                {isLoading ? (
                    <div className="flex justify-center pt-8"><LoadingSpinner /></div>
                ) : accounts.length > 0 ? (
                    <div className="space-y-4">
                        {accounts.map(account => (
                            <div key={account.id} className="bg-[#1C1C1E] p-4 rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <img src={currentUser.avatarUrl} alt="User Avatar" className="w-12 h-12 rounded-full object-cover" />
                                    <div>
                                        <p className="font-semibold text-white">Você</p>
                                        <p className="text-gray-400 text-sm">{account.email}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleDisconnect(account)} className="w-full mt-4 bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors">
                                    {t('settings.connected.disconnect')}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center pt-8">Nenhuma conta do Google conectada.</p>
                )}
            </main>
        </div>
    );
};

export default ConnectedAccountsScreen;
