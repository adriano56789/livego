import React from 'react';
import { HomeIcon, VideoIcon, PlayIcon, MessageIcon } from './icons';
import { RiChat3Line } from 'react-icons/ri';
import { useTranslation } from '../i18n';
import { User } from '../types';
import { avatarFrames, getRemainingDays, getFrameGlowClass } from '../services/database';

interface FooterNavProps {
  currentUser: User;
  onOpenGoLive: () => void;
  activeTab: 'main' | 'profile' | 'messages' | 'video';
  onNavigate: (tab: 'main' | 'profile' | 'messages' | 'video') => void;
}

const FooterNav: React.FC<FooterNavProps> = ({ currentUser, onOpenGoLive, activeTab, onNavigate }) => {
  const { t } = useTranslation();
  const activeOwnedFrame = currentUser.ownedFrames?.find(f => f.frameId === currentUser.activeFrameId);
  const remainingDays = getRemainingDays(activeOwnedFrame?.expirationDate);
  const activeFrame = (currentUser.activeFrameId && activeOwnedFrame && remainingDays && remainingDays > 0)
    ? avatarFrames.find(f => f.id === currentUser.activeFrameId)
    : null;
  const ActiveFrameComponent = activeFrame ? activeFrame.component : null;
  const frameGlowClass = getFrameGlowClass(currentUser.activeFrameId);

  return (
    <footer className="absolute bottom-0 left-0 right-0 z-10 flex-shrink-0 bg-[#1C1C1E] border-t border-gray-700/50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around h-16 text-gray-400">
        <button onClick={() => onNavigate('main')} className={`flex flex-col items-center w-1/5 pt-1 ${activeTab === 'main' ? 'text-white' : 'hover:text-white'}`}>
          <HomeIcon className="w-6 h-6" />
          <span className="text-sm mt-1">{t('footer.live')}</span>
        </button>
        <button onClick={() => onNavigate('video')} className={`flex flex-col items-center w-1/5 pt-1 ${activeTab === 'video' ? 'text-white' : 'hover:text-white'}`}>
          <VideoIcon className="w-6 h-6" />
          <span className="text-sm mt-1">{t('footer.video')}</span>
        </button>
        <button
          onClick={onOpenGoLive}
          className="w-16 h-16 -mt-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
          <PlayIcon className="w-8 h-8 text-white" />
        </button>
        <button onClick={() => onNavigate('messages')} className={`flex flex-col items-center w-1/5 pt-1 relative ${activeTab === 'messages' ? 'text-white' : 'hover:text-white'}`}>
          <RiChat3Line className="w-6 h-6" />
          <span className="absolute top-0 right-1/2 translate-x-3.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#1C1C1E]"></span>
          <span className="text-sm mt-1">{t('footer.message')}</span>
        </button>
        <button onClick={() => onNavigate('profile')} className={`flex flex-col items-center w-1/5 pt-1 ${activeTab === 'profile' ? 'text-white' : 'hover:text-white'}`}>
          <div className="relative w-6 h-6">
            <img src={currentUser.avatarUrl} alt="User" className="w-full h-full rounded-full object-cover" />
            {ActiveFrameComponent && (
              <div className={`absolute -top-1 -left-1 w-8 h-8 pointer-events-none ${frameGlowClass}`}>
                <ActiveFrameComponent />
              </div>
            )}
            {currentUser.isLive ? (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1C1C1E]"></div>
            ) : currentUser.isOnline && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#1C1C1E]"></div>
            )}
          </div>
          <span className="text-sm mt-1">{t('footer.profile')}</span>
        </button>
      </div>
    </footer>
  );
};

export default FooterNav;