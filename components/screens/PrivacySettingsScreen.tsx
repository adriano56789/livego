import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, MessageIcon } from '../icons';
import { useTranslation } from '../../i18n';
import { User, ToastType } from '../../types';
import { api } from '../../services/api';
import { LoadingSpinner } from '../Loading';

const Toggle = ({ active, onToggle, loading = false }: { active: boolean, onToggle: () => void, loading?: boolean }) => (
    <div 
        onClick={(e) => { e.stopPropagation(); if(!loading) onToggle(); }}
        className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${active ? 'bg-purple-600' : 'bg-gray-700'} ${loading ? 'opacity-50' : ''}`}
    >
        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${active ? 'translate-x-5' : 'translate-x-0'} flex items-center justify-center`}>
            {loading && <div className="w-2 h-2 border border-purple-500 border-t-transparent animate-spin rounded-full"></div>}
        </div>
    </div>
);

const SettingRow: React.FC<{ label: string, subLabel?: string, children?: React.ReactNode, onClick?: () => void, icon?: React.FC<any>, color?: string }> = ({ label, subLabel, children, onClick, icon: Icon, color = "text-gray-400" }) => (
    <div 
        onClick={onClick}
        className="flex items-center justify-between py-4 px-4 active:bg-white/5 bg-[#121212] border-b border-white/5 shrink-0 cursor-pointer"
    >
        <div className="flex items-center gap-3 max-w-[80%]">
            {Icon && <Icon className={`w-5 h-5 ${color}`} />}
            <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-white">{label}</span>
                {subLabel && <span className="text-[10px] text-gray-500 leading-tight">{subLabel}</span>}
            </div>
        </div>
        <div className="flex items-center gap-3">
            {children}
        </div>
    </div>
);

const PrivacySettingsScreen: React.FC<{ onBack: () => void, navigateTo: (p: string) => void }> = ({ onBack, navigateTo }) => {
    const { t } = useTranslation();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const addToast = (type: ToastType, message: string) => {
        console.log(`[Toast:${type}] ${message}`);
    };

    useEffect(() => {
        api.users.me().then(user => {
            setCurrentUser(user);
        }).catch(() => {
            addToast(ToastType.Error, "Falha ao carregar os dados do usuário.");
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    const handleSettingUpdate = async (updates: Partial<User>) => {
        if (isUpdating || !currentUser) return;
        setIsUpdating(true);
        try {
            const { success, user } = await api.users.update('me', updates);
            if (success && user) {
                setCurrentUser(user);
                addToast(ToastType.Success, "Configuração salva!");
            }
        } catch (error) {
            addToast(ToastType.Error, "Falha ao salvar a configuração.");
        } finally {
            setIsUpdating(false);
        }
    };
    
    const togglePrivacy = (key: keyof User) => {
        if (!currentUser) return;
        handleSettingUpdate({ [key]: !((currentUser as any)[key]) });
    };

    const chatPermissionLabels = {
        'all': 'Todos',
        'followers': 'Apenas Seguidores',
        'none': 'Ninguém'
    };
    
    if (loading) {
        return (
            <div className="flex flex-col h-full bg-[#121212]">
                <header className="flex items-center p-4 flex-shrink-0 border-b border-white/5">
                    <button onClick={onBack}><ChevronLeftIcon className="w-6 h-6 text-white" /></button>
                    <div className="flex-grow text-center mr-6"><h1 className="text-lg font-bold text-white">{t('privacy.title')}</h1></div>
                </header>
                <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
            </div>
        );
    }
    
    if (!currentUser) {
        return (
            <div className="flex flex-col h-full bg-[#121212]">
                <header className="flex items-center p-4 flex-shrink-0 border-b border-white/5">
                    <button onClick={onBack}><ChevronLeftIcon className="w-6 h-6 text-white" /></button>
                    <div className="flex-grow text-center mr-6"><h1 className="text-lg font-bold text-white">{t('privacy.title')}</h1></div>
                </header>
                <div className="flex-1 flex items-center justify-center text-red-500">Falha ao carregar dados.</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#121212]">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-white/5">
                <button onClick={onBack}><ChevronLeftIcon className="w-6 h-6 text-white" /></button>
                <div className="flex-grow text-center mr-6"><h1 className="text-lg font-bold text-white">{t('privacy.title')}</h1></div>
            </header>
            <div className="flex-grow pt-2">
                <SettingRow label={t('privacy.showLocation')} subLabel={t('privacy.showLocationSub')}>
                    <Toggle active={!!currentUser.showLocation} onToggle={() => togglePrivacy('showLocation')} loading={isUpdating} />
                </SettingRow>
                <SettingRow label={t('privacy.showActivityStatus')} subLabel={t('privacy.showActivityStatusSub')}>
                    <Toggle active={!!currentUser.showActivityStatus} onToggle={() => togglePrivacy('showActivityStatus')} loading={isUpdating} />
                </SettingRow>
                <SettingRow label={t('privacy.hideLikes')} subLabel={t('privacy.hideLikesSub')}>
                    <Toggle active={!!currentUser.hideLikes} onToggle={() => togglePrivacy('hideLikes')} loading={isUpdating} />
                </SettingRow>
                <SettingRow icon={MessageIcon} label={t('privacy.whoCanMessageMe')} onClick={() => navigateTo('who_can_message')}>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">{chatPermissionLabels[currentUser.chatPermission || 'all']}</span>
                        <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                    </div>
                </SettingRow>
            </div>
        </div>
    );
};

export default PrivacySettingsScreen;