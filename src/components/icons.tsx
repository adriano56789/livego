import React from 'react';
import { FaQuestion, FaGift, FaUserFriends, FaSearch, FaPlus, FaBell, FaLock, FaTrophy, FaHeart, FaCalendarAlt, FaChevronRight, FaMapMarkerAlt, FaUser, FaCheck, FaTimes, FaGlobe, FaClock, FaExclamationTriangle, FaLanguage, FaComment, FaPaperPlane, FaEllipsisH } from 'react-icons/fa';
import { RiVipCrownFill } from 'react-icons/ri';

// Re-export all icons for easy access
export {
  FaQuestion as QuestionMarkIcon,
  FaGift as GiftIcon,
  FaUserFriends as UserFriendsIcon,
  FaSearch as SearchIcon,
  FaPlus as PlusIcon,
  FaBell as BellIcon,
  FaLock as LockIcon,
  FaTrophy as TrophyIcon,
  FaHeart as HeartIcon,
  FaCalendarAlt as CalendarIcon,
  FaChevronRight as ChevronRightIcon,
  FaMapMarkerAlt as LocationPinIcon,
  FaUser as UserIcon,
  FaCheck as CheckIcon,
  FaTimes as CloseIcon,
  FaGlobe as GlobeIcon,
  FaClock as ClockIcon,
  FaExclamationTriangle as WarningTriangleIcon,
  FaLanguage as TranslateIcon,
  RiVipCrownFill as CrownIcon,
  FaComment as MessageIcon,
  FaPaperPlane as SendIcon,
  FaEllipsisH as MoreIcon
};

// Custom icon components
type IconProps = {
  className?: string;
  style?: React.CSSProperties;
};

export const FanBadgeIcon: React.FC<IconProps> = ({ className = '', style }) => (
  <span className={`inline-flex items-center justify-center ${className}`} style={style}>
    <RiVipCrownFill className="text-yellow-400" />
  </span>
);

export const LiveIndicatorIcon: React.FC<IconProps> = ({ className = '', style }) => (
  <span className={`inline-block w-2 h-2 bg-red-500 rounded-full ${className}`} style={style} />
);

export const GoldCoinWithGIcon: React.FC<IconProps> = ({ className = '', style }) => (
  <span className={`inline-flex items-center justify-center text-yellow-500 ${className}`} style={style}>
    <span className="font-bold">G</span>
  </span>
);

export const YellowDiamondIcon: React.FC<IconProps> = ({ className = '', style }) => (
  <span className={`inline-block w-4 h-4 bg-yellow-400 transform rotate-45 ${className}`} style={style} />
);

export const SoundWaveIcon: React.FC<IconProps> = ({ className = '', style }) => (
  <span className={`inline-flex items-center space-x-0.5 ${className}`} style={style}>
    {[1, 2, 3].map((i) => (
      <span key={i} className="w-0.5 h-3 bg-white rounded-full animate-pulse" style={{
        animationDelay: `${i * 0.1}s`,
        animationDuration: '1s',
        animationIterationCount: 'infinite',
      }} />
    ))}
  </span>
);

export const FanClubHeaderIcon: React.FC<IconProps> = ({ className = '', style }) => (
  <span className={`inline-flex items-center justify-center ${className}`} style={style}>
    <RiVipCrownFill className="text-purple-400" />
  </span>
);

export const ViewerIcon: React.FC<IconProps> = ({ className = '', style }) => (
  <span className={`inline-flex items-center justify-center ${className}`} style={style}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  </span>
);

// Re-export all react-icons for direct usage
export * from 'react-icons/fa';
export * from 'react-icons/ri';
