import React from 'react';
import { 
    BrazilFlagIcon,
    MaleIcon,
    FemaleIcon,
    CopyIcon,
    WalletIcon,
    GoldCoinIcon,
    MarketIcon,
    RankIcon,
    FansIcon,
    BlockIcon,
    AvatarProtectIcon,
    EnvelopeIcon,
    FAQIcon,
    SettingsIcon,
    ChevronRightIcon,
    VIPIcon,
    CustomDiamondIcon,
    VIPBadgeIcon,
    ShieldIcon,
    LiveIndicatorIcon,
    BankIcon,
    FanBadgeIcon
} from './icons';
import { User } from '../types';
import { useTranslation } from '../i18n';
import { avatarFrames, getRemainingDays, getFrameGlowClass } from '../services/database';

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
    onOpenFAQ: () => void;
    onOpenSettings: () => void;
    onOpenSupportChat: () => void;
    onOpenAdminWallet: () => void;
    onOpenWalletTest: () => void;
    onOpenAvatarProtection: () => void;
    visitors: User[];
}

const formatNumber = (num: any): string => {
    const numericValue = Number(num);
    if (num === null || num === undefined || isNaN(numericValue)) {
        return '0';
    }
    if (numericValue >= 1000000) {
        return (numericValue / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (numericValue >= 1000) {
        return (numericValue / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
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
    onOpenFAQ,
    onOpenSettings,
    onOpenSupportChat,
    onOpenAdminWallet,
    visitors
}) => {
    const { t } = useTranslation();
    
    const avatarAction = currentUser.isLive ? onEnterMyStream : onOpenProfile;
    const avatarAriaLabel = currentUser.isLive ? "Entrar na sua transmissão ao vivo" : "Ver perfil detalhado";

    const menuItems = [
        { icon: <MarketIcon className="h-6 w-6 text-blue-400" />, label: t('profile.menu.market'), action: onOpenMarket },
        { icon: <RankIcon className="h-6 w-6 text-yellow-500" />, label: t('profile.menu.myLevel'), action: onOpenMyLevel },
        { icon: <FansIcon className="h-6 w-6 text-green-400" />, label: t('profile.menu.myFans'), action: onOpenTopFans },
        { icon: <BlockIcon className="h-6 w-6 text-red-500" />, label: t('profile.menu.blockList'), action: onOpenBlockList },
        { icon: <EnvelopeIcon className="h-6 w-6 text-cyan-400" />, label: t('profile.menu.support'), action: onOpenSupportChat },
        { icon: <EnvelopeIcon className="h-6 w-6 text-gray-400" />, label: t('profile.menu.messages'), action: onNavigateToMessages },
        { icon: <FAQIcon className="h-6 w-6 text-gray-400" />, label: t('profile.menu.faq'), action: onOpenFAQ },
        { icon: <SettingsIcon className="h-6 w-6 text-gray-400" />, label: t('profile.menu.settings'), action: onOpenSettings },
        { icon: <BankIcon className="h-6 w-6 text-amber-300" />, label: 'Carteira Admin', action: onOpenAdminWallet, isAdminOnly: true },
    ];

    const activeOwnedFrame = currentUser.ownedFrames?.find(f => f.frameId === currentUser.activeFrameId);
    const remainingDays = getRemainingDays(activeOwnedFrame?.expirationDate);
    const activeFrame = (currentUser.activeFrameId && activeOwnedFrame && remainingDays && remainingDays > 0)
        ? avatarFrames.find(f => f.id === currentUser.activeFrameId)
        : null;
    const ActiveFrameComponent = activeFrame ? activeFrame.component : null;
    const frameGlowClass = getFrameGlowClass(currentUser.activeFrameId);


  return (
    <div className="bg-[#111111] h-full text-white overflow-y-auto no-scrollbar pb-24 flex flex-col">
      <div>
        {/* Profile Header */}
        <div className="flex flex-col items-center pt-8 pb-4 px-4 bg-[#111111]">
          <button onClick={avatarAction} className="relative group" aria-label={avatarAriaLabel}>
            <div className="relative w-24 h-24">
                <img
                  src={currentUser.avatarUrl}
                  alt="User Avatar"
                  className="w-full h-full rounded-full object-cover p-1 group-hover:opacity-80 transition-opacity bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900"
                />
                
                {ActiveFrameComponent && (
                    <div className={`absolute -top-2 -left-2 w-28 h-28 pointer-events-none ${frameGlowClass}`}>
                        <ActiveFrameComponent />
                    </div>
                )}
                
                {currentUser.isAvatarProtected && (
                  <div className="absolute top-0 right-0 bg-black/50 rounded-full p-1 z-10">
                    <ShieldIcon className="w-5 h-5 text-blue-400" />
                  </div>
                )}
                
                {currentUser.isLive ? (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/60 rounded-md px-2 py-1 flex items-center space-x-1.5 backdrop-blur-sm z-10">
                      <LiveIndicatorIcon className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">{t('footer.live')}</span>
                    </div>
                ) : (
                    <>
                        {currentUser.isOnline && (
                          <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-black z-10" title="Online"></div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-0.5 z-10">
                          <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center">
                            <BrazilFlagIcon />
                          </div>
                        </div>
                    </>
                )}
            </div>
        </button>
          <div className="mt-4">
            <div className="flex items-center justify-center space-x-2 text-center">
                <h1 className="text-2xl font-bold">{currentUser.name}</h1>
                {currentUser.isVIP && (
                    <VIPBadgeIcon className="w-6 h-6" />
                )}
            </div>
          </div>

          <div className="flex items-center space-x-2 my-2">
              {currentUser.age && (
                <span className={`text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center space-x-1 ${currentUser.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                    {currentUser.gender === 'male' ? <MaleIcon className="h-3 w-3" /> : <FemaleIcon className="h-3 w-3" />}
                    <span>{currentUser.age}</span>
                </span>
              )}
               <span className="bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center space-x-1">
                  <RankIcon className="h-3 w-3" />
                  <span>{currentUser.level}</span>
              </span>
          </div>

          <div className="text-center text-gray-400 text-sm">
              <div className="flex items-center justify-center space-x-2">
                  <span>{t('profile.id')}: {currentUser.identification}</span>
                  <button className="text-gray-500 hover:text-white"><CopyIcon className="h-4 w-4" /></button>
              </div>
              <p>
                {currentUser.country === 'br' ? 'Brasil' : currentUser.country} | {currentUser.showLocation ? (currentUser.location || 'desconhecido') : 'desconhecido'}
              </p>
          </div>

          <div className="flex justify-around w-full mt-6">
              <button onClick={onOpenFollowing} className="text-center p-2 rounded-lg hover:bg-gray-800/50 transition-colors focus:outline-none">
                  <p className="text-xl font-bold">{formatNumber(currentUser.following)}</p>
                  <p className="text-sm text-gray-400">{t('profile.following')}</p>
              </button>
              <button onClick={onOpenFans} className="text-center p-2 rounded-lg hover:bg-gray-800/50 transition-colors focus:outline-none">
                  <p className="text-xl font-bold">{formatNumber(currentUser.fans)}</p>
                  <p className="text-sm text-gray-400">{t('profile.fans')}</p>
              </button>
              <button onClick={onOpenVisitors} className="text-center p-2 rounded-lg hover:bg-gray-800/50 transition-colors focus:outline-none">
                  <p className="text-xl font-bold">{formatNumber(visitors.length)}</p>
                  <p className="text-sm text-gray-400">{t('profile.visitors')}</p>
              </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="px-2 sm:px-4 py-4 space-y-2">
          {/* Wallet */}
          <div className="flex items-center justify-between p-4 bg-[#111111] rounded-lg w-full">
              <button onClick={() => onOpenWallet()} className="flex items-center space-x-3 text-left hover:opacity-80 transition-opacity">
                  <WalletIcon className="h-6 w-6 text-yellow-400" />
                  <span className="font-semibold">{t('profile.wallet')}</span>
              </button>
              <div className="flex items-center space-x-4">
                  <button onClick={() => onOpenWallet('Diamante')} className="flex items-center space-x-1 hover:opacity-80 transition-opacity">
                      <CustomDiamondIcon className="h-4 w-4" />
                      <span className="text-sm">{currentUser.diamonds?.toLocaleString('pt-BR')}</span>
                  </button>
                  <button onClick={() => onOpenWallet('Ganhos')} className="flex items-center space-x-1 hover:opacity-80 transition-opacity">
                      <GoldCoinIcon className="h-4 w-4 text-orange-400" />
                          <span className="text-sm">{currentUser.earnings?.toLocaleString('pt-BR')}</span>
                  </button>
                  <button onClick={() => onOpenWallet()} className="hover:opacity-80 transition-opacity">
                      <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                  </button>
              </div>
          </div>
          
          {/* Menu List */}
          <div className="bg-[#111111] rounded-lg overflow-hidden">
              {menuItems.map((item, index) => {
                  if ((item as any).isAdminOnly && currentUser.platformEarnings === undefined) {
                      return null;
                  }
                  return (
                      <button key={index} onClick={item.action} disabled={!item.action} className="flex items-center justify-between p-4 hover:bg-[#2c2c2e] transition-colors w-full text-left disabled:opacity-60 disabled:cursor-not-allowed">
                          <div className="flex items-center space-x-3">
                              {item.icon}
                              <span className="text-gray-200">{item.label}</span>
                          </div>
                          <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                      </button>
                  )
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
