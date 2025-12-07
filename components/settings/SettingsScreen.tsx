

import React, { useState } from 'react';
import { 
    BackIcon, 
    ChevronRightIcon, 
    ViewerIcon, 
    BellIcon,
    GiftIcon,
    EnvelopeIcon,
    LockIcon,
    DollarCircleIcon,
    DocumentTextIcon,
    ZoomInIcon,
    TrashIcon,
    GlobeIcon,
    AvatarProtectIcon
} from '../icons';
import ConnectedAccountsScreen from './ConnectedAccountsScreen';
import NotificationSettingsScreen from './NotificationSettingsScreen';
import PrivacySettingsScreen from './PrivacySettingsScreen';
import PushSettingsScreen from './PushSettingsScreen';
import WhoCanMessageScreen from './WhoCanMessageScreen';
import PrivateLiveSettingsScreen from './PrivateLiveSettingsScreen';
import { GiftNotificationSettingsScreen } from './GiftNotificationSettingsScreen';
import ZoomSettingsScreen from './ZoomSettingsScreen';
import AppVersionScreen from './AppVersionScreen';
import EarningsInfoScreen from './EarningsInfoScreen';
import CopyrightScreen from './CopyrightScreen';
import DeleteAccountScreen from './DeleteAccountScreen';
import { useTranslation } from '../../i18n';
import { User, Gift, ToastType } from '../../types';

interface SettingsListItemProps {
    label: string; 
    icon: React.ReactNode; 
    onClick: () => void; 
    isDestructive?: boolean;
}

const SettingsListItem: React.FC<SettingsListItemProps> = ({ label, icon, onClick, isDestructive = false }) => (
    <button onClick={onClick} className="flex items-center justify-between w-full px-4 py-3 bg-transparent hover:bg-gray-800/50 transition-colors">
        <div className="flex items-center space-x-4">
            <div className={`w-6 h-6 flex items-center justify-center ${isDestructive ? 'text-red-500' : 'text-gray-400'}`}>
                {icon}
            </div>
            <span className={`text-base ${isDestructive ? 'text-red-500' : 'text-white'}`}>{label}</span>
        </div>
        {!isDestructive && <ChevronRightIcon className="w-5 h-5 text-gray-600" />}
    </button>
);


const MainSettingsPage: React.FC<{ navigateTo: (page: string) => void; onLogout: () => void; onOpenLanguageModal: () => void; onOpenAvatarProtection: () => void; }> = ({ navigateTo, onLogout, onOpenLanguageModal, onOpenAvatarProtection }) => {
    const { t } = useTranslation();
    const menuItems = [
        { icon: <ViewerIcon className="h-6 w-6" />, label: t('settings.main.connectedAccounts'), action: () => navigateTo('connected_accounts') },
        { icon: <BellIcon className="h-6 w-6" />, label: t('settings.main.notificationSettings'), action: () => navigateTo('notifications') },
        { icon: <GiftIcon className="h-6 w-6" />, label: t('settings.main.giftNotifications'), action: () => navigateTo('gift_notifications') },
        { icon: <EnvelopeIcon className="h-6 w-6" />, label: t('settings.main.privateLiveInvite'), action: () => navigateTo('private_live') },
        { icon: <LockIcon className="h-6 w-6" />, label: t('settings.main.privacySettings'), action: () => navigateTo('privacy') },
        { icon: <AvatarProtectIcon className="h-6 w-6" />, label: t('profile.menu.avatarProtection'), action: onOpenAvatarProtection },
        { icon: <DollarCircleIcon className="h-6 w-6" />, label: t('settings.main.earningsInfo'), action: () => navigateTo('earnings_info') },
        { icon: <GlobeIcon className="h-6 w-6" />, label: t('settings.main.language'), action: onOpenLanguageModal },
        { icon: <DocumentTextIcon className="h-6 w-6" />, label: t('settings.main.copyright'), action: () => navigateTo('copyright') },
        { icon: <DocumentTextIcon className="h-6 w-6" />, label: t('settings.main.appVersion'), action: () => navigateTo('app_version') },
        { icon: <ZoomInIcon className="h-6 w-6" />, label: t('settings.main.zoomAdjustment'), action: () => navigateTo('zoom') },
        { icon: <TrashIcon className="h-6 w-6" />, label: t('settings.main.deleteAccount'), action: () => navigateTo('delete_account'), isDestructive: true },
    ];

    return (
        <>
            <div className="flex-grow overflow-y-auto no-scrollbar pt-2">
                <div className="space-y-px">
                    {menuItems.map((item) => (
                        <SettingsListItem 
                            key={item.label}
                            label={item.label} 
                            icon={item.icon} 
                            onClick={item.action} 
                            isDestructive={item.isDestructive} 
                        />
                    ))}
                </div>
            </div>
             <footer className="p-4 flex-shrink-0">
                 <button onClick={onLogout} className="w-full bg-[#D62F4D] text-white font-semibold py-3 rounded-lg hover:bg-red-700/90 transition-colors">
                    {t('settings.main.logout')}
                </button>
            </footer>
        </>
    );
};


interface SettingsScreenProps {
    onClose: () => void; 
    currentUser: User; 
    gifts: Gift[]; 
    updateUser: (user: User) => void; 
    addToast: (type: ToastType, message: string) => void; 
    onOpenPipModal: () => void;
    onLogout: () => void;
    onDeleteAccount: () => void;
    onOpenLanguageModal: () => void;
    onOpenAvatarProtection: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose, currentUser, gifts, updateUser, addToast, onOpenPipModal, onLogout, onDeleteAccount, onOpenLanguageModal, onOpenAvatarProtection }) => {
    const [page, setPage] = useState('main');
    const { t } = useTranslation();

    const navigateTo = (pageName: string) => setPage(pageName);

    const renderPage = () => {
        switch (page) {
            case 'connected_accounts':
                return <ConnectedAccountsScreen onBack={() => setPage('main')} currentUser={currentUser} addToast={addToast} onLogout={onLogout} />;
            case 'notifications':
                return <NotificationSettingsScreen onBack={() => setPage('main')} navigateTo={navigateTo} currentUser={currentUser} />;
            case 'privacy':
                return <PrivacySettingsScreen onBack={() => setPage('main')} navigateTo={navigateTo} onOpenPipModal={onOpenPipModal} currentUser={currentUser} updateUser={updateUser} addToast={addToast} />;
            case 'who_can_message':
                return <WhoCanMessageScreen onBack={() => setPage('privacy')} currentUser={currentUser} updateUser={updateUser} addToast={addToast} />;
            case 'private_live':
                return <PrivateLiveSettingsScreen onBack={() => setPage('main')} currentUser={currentUser} updateUser={updateUser} addToast={addToast} />;
            case 'gift_notifications':
                return <GiftNotificationSettingsScreen onBack={() => setPage('main')} user={currentUser} gifts={gifts} />;
            case 'zoom':
                return <ZoomSettingsScreen onBack={() => setPage('main')} />;
            case 'app_version':
                return <AppVersionScreen onBack={() => setPage('main')} />;
            case 'earnings_info': 
                return <EarningsInfoScreen onBack={() => setPage('main')} />;
            case 'copyright': 
                return <CopyrightScreen onBack={() => setPage('main')} />;
            case 'delete_account': 
                return <DeleteAccountScreen onBack={() => setPage('main')} onDelete={onDeleteAccount} />;
            default:
                return <MainSettingsPage navigateTo={navigateTo} onLogout={onLogout} onOpenLanguageModal={onOpenLanguageModal} onOpenAvatarProtection={onOpenAvatarProtection} />;
        }
    };
    
    return (
        <div className="absolute inset-0 bg-[#111] z-50 flex flex-col text-white">
          {page === 'main' && (
             <header className="flex items-center p-4 flex-shrink-0">
                <button onClick={onClose} className="absolute"><BackIcon className="w-6 h-6" /></button>
                <div className="flex-grow text-center"><h1 className="text-xl font-bold">{t('settings.title')}</h1></div>
             </header>
          )}
          {renderPage()}
        </div>
    );
};

export default SettingsScreen;
