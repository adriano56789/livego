import React from 'react';
import { User } from './src/types';
import { useTranslation } from 'react-i18next';
import { 
    WalletIcon,
    LiveIndicatorIcon
} from './components/icons';

interface ProfileScreenProps {
    currentUser: User;
    onOpenProfile: () => void;
    onEnterMyStream: () => void;
    onOpenWallet: (initialTab?: 'Diamante' | 'Ganhos') => void;
    onOpenFollowing: () => void;
    onOpenFans: () => void;
    onOpenVisitors: () => void;
    onOpenTopFans: () => void;
    onNavigateToMessages: () => void;
    onOpenMarket: () => void;
    onOpenMyLevel: () => void;
    onOpenBlockList: () => void;
    onOpenAvatarProtection: () => void;
    onOpenFAQ: () => void;
    onOpenSettings: () => void;
    onOpenSupportChat: () => void;
    onOpenAdminWallet: () => void;
    visitors: User[];
}

const formatNumber = (num: any): string => {
    const numericValue = Number(num);
    if (isNaN(numericValue)) return '0';
    
    if (numericValue >= 1000000) {
        return (numericValue / 1000000).toFixed(1) + 'M';
    } else if (numericValue >= 1000) {
        return (numericValue / 1000).toFixed(1) + 'K';
    }
    return String(numericValue);
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({
    currentUser,
    onOpenProfile,
    onEnterMyStream,
    onOpenWallet,
    onOpenFollowing,
    onOpenFans,
    onOpenVisitors,
    onOpenTopFans,
    onNavigateToMessages,
    onOpenMarket,
    onOpenMyLevel,
    onOpenBlockList,
    onOpenAvatarProtection,
    onOpenFAQ,
    onOpenSettings,
    onOpenSupportChat,
    onOpenAdminWallet,
    visitors = []
}) => {
    const { t } = useTranslation();
    
    return (
        <div className="profile-screen">
            {/* Profile header with user info */}
            <div className="profile-header">
                <div className="profile-avatar-container">
                    <img 
                        src={currentUser.avatarUrl} 
                        alt={currentUser.name} 
                        className="profile-avatar"
                    />
                    {currentUser.isLive && (
                        <div className="live-badge">
                            <LiveIndicatorIcon />
                            <span>{t('live')}</span>
                        </div>
                    )}
                </div>
                
                <div className="profile-info">
                    <div className="profile-name-row">
                        <h1>{currentUser.name}</h1>
                        <button 
                            className="edit-profile-btn"
                            onClick={onOpenProfile}
                        >
                            {t('editProfile')}
                        </button>
                    </div>
                    
                    <div className="profile-stats">
                        <div className="stat" onClick={onOpenFollowing}>
                            <strong>{formatNumber(currentUser.followingCount || 0)}</strong>
                            <span>{t('following')}</span>
                        </div>
                        <div className="stat" onClick={onOpenFans}>
                            <strong>{formatNumber(currentUser.followersCount || 0)}</strong>
                            <span>{t('followers')}</span>
                        </div>
                        <div className="stat" onClick={onOpenVisitors}>
                            <strong>{formatNumber(visitors.length)}</strong>
                            <span>{t('visitors')}</span>
                        </div>
                    </div>
                    
                    <div className="profile-bio">
                        {currentUser.bio || t('noBio')}
                    </div>
                </div>
            </div>
            
            {/* Action buttons */}
            <div className="profile-actions">
                <button 
                    className="action-btn primary"
                    onClick={onEnterMyStream}
                >
                    {t('goLive')}
                </button>
                <button 
                    className="action-btn secondary"
                    onClick={() => onOpenWallet()}
                >
                    <WalletIcon />
                    <span>{t('wallet')}</span>
                </button>
            </div>
            
            {/* Additional sections */}
            <div className="profile-sections">
                {/* Add more sections as needed */}
            </div>
        </div>
    );
};

export default ProfileScreen;