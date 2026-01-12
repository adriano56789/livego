
import React from 'react';
import { Home, Video, MessageCircle, User, Play } from 'lucide-react';
import { User as UserType } from '@/types';
import { useTranslation } from '@/i18n';

interface FooterNavProps {
  currentUser: UserType | null;
  onOpenGoLive: () => void;
  activeTab: 'main' | 'profile' | 'messages' | 'video';
  onNavigate: (screen: 'main' | 'profile' | 'messages' | 'video') => void;
  onSecretTap?: () => void;
}

const FooterNav: React.FC<FooterNavProps> = ({ onOpenGoLive, activeTab, onNavigate, onSecretTap }) => {
  const { t } = useTranslation();

  return (
    <div 
      onClick={onSecretTap}
      className="fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-white/5 h-[70px] flex items-end justify-between px-2 z-40 pb-2"
    >
      
      {/* 1. Ao vivo (Home) */}
      <button 
        onClick={() => onNavigate('main')}
        className="flex flex-1 flex-col items-center justify-end gap-1 h-full pb-2"
      >
        <Home 
          size={24} 
          className={activeTab === 'main' ? 'text-white' : 'text-gray-500'} 
          strokeWidth={activeTab === 'main' ? 2.5 : 2}
        />
        <span className={`text-[10px] font-medium ${activeTab === 'main' ? 'text-white' : 'text-gray-500'}`}>
          Ao vivo
        </span>
      </button>

      {/* 2. Vídeo */}
      <button 
        onClick={() => onNavigate('video')}
        className="flex flex-1 flex-col items-center justify-end gap-1 h-full pb-2"
      >
        <Video 
          size={24} 
          className={activeTab === 'video' ? 'text-white' : 'text-gray-500'} 
          strokeWidth={activeTab === 'video' ? 2.5 : 2}
        />
        <span className={`text-[10px] font-medium ${activeTab === 'video' ? 'text-white' : 'text-gray-500'}`}>
          Vídeo
        </span>
      </button>

      {/* 3. Middle Action Button (Floating Play/Record) */}
      <div className="flex-1 flex justify-center h-full relative group">
          <button 
            onClick={onOpenGoLive}
            className="absolute -top-4 w-14 h-14 rounded-full bg-gradient-to-tr from-[#C135F3] to-[#FF4D9E] flex items-center justify-center shadow-lg shadow-purple-900/40 transition-transform active:scale-95"
          >
            <Play size={28} className="text-white fill-white ml-1" />
          </button>
      </div>

      {/* 4. Chat */}
      <button 
        onClick={() => onNavigate('messages')}
        className="flex flex-1 flex-col items-center justify-end gap-1 h-full pb-2"
      >
        <MessageCircle 
          size={24} 
          className={activeTab === 'messages' ? 'text-white' : 'text-gray-500'} 
          strokeWidth={activeTab === 'messages' ? 2.5 : 2}
        />
        <span className={`text-[10px] font-medium ${activeTab === 'messages' ? 'text-white' : 'text-gray-500'}`}>
          Chat
        </span>
      </button>

      {/* 5. Perfil */}
      <button 
        onClick={() => onNavigate('profile')}
        className="flex flex-1 flex-col items-center justify-end gap-1 h-full pb-2"
      >
        <User 
          size={24} 
          className={activeTab === 'profile' ? 'text-white' : 'text-gray-500'} 
          strokeWidth={activeTab === 'profile' ? 2.5 : 2}
        />
        <span className={`text-[10px] font-medium ${activeTab === 'profile' ? 'text-white' : 'text-gray-500'}`}>
          Perfil
        </span>
      </button>
    </div>
  );
};

export default FooterNav;
