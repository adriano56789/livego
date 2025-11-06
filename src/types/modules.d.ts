// Type definitions for modules that don't have their own type definitions
declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

// Declare modules for components that are causing errors
declare module './AppVersionScreen';
declare module './EarningsInfoScreen';
declare module './CopyrightScreen';
declare module './DeleteAccountScreen';
declare module './LanguageSelectionModal';

// Add other module declarations as needed

// For services
declare module '../services/api';
declare module '../services/websocket';
declare module '../services/database';

// For components
declare module '../components/LoginScreen';
declare module '../components/ProfileScreen';
declare module '../components/MessagesScreen';
declare module '../components/FooterNav';
declare module '../components/ReminderModal';
declare module '../components/RegionModal';
declare module '../components/GoLiveScreen';
declare module '../components/Toast';
declare module '../components/BroadcasterProfileScreen';
declare module '../components/EditProfileScreen';
declare module '../components/WalletScreen';
declare module '../components/FollowingScreen';
declare module '../components/FansScreen';
declare module '../components/VisitorsScreen';
declare module '../components/TopFansScreen';
declare module '../components/MyLevelScreen';
declare module '../components/BlockListScreen';
declare module '../components/AvatarProtectionScreen';
declare module '../components/MarketScreen';
declare module '../components/FAQScreen';
declare module '../components/settings/SettingsScreen';
declare module '../components/SearchScreen';
declare module '../components/CameraPermissionModal';
declare module '../components/LocationPermissionModal';
declare module '../components/live/EndStreamConfirmationModal';
declare module '../components/EndStreamSummaryScreen';
declare module '../components/PrivateChatModal';
declare module '../components/settings/PKBattleTimerSettingsScreen';
declare module '../components/FriendRequestsScreen';
declare module '../components/settings/PipSettingsModal';
declare module '../components/PrivateInviteModal';
declare module '../components/VideoScreen';
declare module '../components/FullScreenPhotoViewer';
declare module '../components/LiveHistoryScreen';
declare module '../components/settings/LanguageSelectionModal';
declare module '../components/AdminWalletScreen';
declare module '../components/VIPCenterScreen';
declare module '../components/live/FanClubMembersModal';

// For icons
declare module '../components/icons' {
  import { IconType } from 'react-icons';
  
  export const BackIcon: IconType;
  export const ThreeDotsIcon: IconType;
  export const SendIcon: IconType;
  export const GalleryIcon: IconType;
  export const CheckIcon: IconType;
  export const DoubleCheckIcon: IconType;
  export const UserIcon: IconType;
  export const CloseIcon: IconType;
  export const LiveIndicatorIcon: IconType;
  export const ClockIcon: IconType;
  export const WarningTriangleIcon: IconType;
  export const TranslateIcon: IconType;
  export const BankIcon: IconType;
  export const CreditCardIcon: IconType;
  export const YellowDiamondIcon: IconType;
  export const PencilIcon: IconType;
  export const FemaleIcon: IconType;
  export const MaleIcon: IconType;
  export const RankIcon: IconType;
  export const MessageIcon: IconType;
  export const MoreIcon: IconType;
  export const PlusIcon: IconType;
  export const SoundWaveIcon: IconType;
  export const GoldCoinWithGIcon: IconType;
  export const HeartIcon: IconType;
  export const TrophyIcon: IconType;
  export const BellIcon: IconType;
  export const CalendarIcon: IconType;
  export const FanClubHeaderIcon: IconType;
  export const StarIcon: IconType;
  export const CrownIcon: IconType;
  
  // Add other icon exports as needed
}
