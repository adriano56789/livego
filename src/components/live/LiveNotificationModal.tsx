
import React, { useEffect, useState } from 'react';
import { CloseIcon, LiveIndicatorIcon } from '../icons';
import { useTranslation } from '../../i18n';

interface LiveNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWatch: () => void;
  data: {
    streamerId: string;
    streamerName: string;
    streamerAvatar: string;
    message?: string;
  } | null;
}

const LiveNotificationModal: React.FC<LiveNotificationModalProps> = ({ isOpen, onClose, onWatch, data }) => {
  const { t } = useTranslation();
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsExiting(false);
      
      // Auto-close timer for In-App Modal (sobe e some sozinho)
      const timer = setTimeout(() => {
        handleClose();
      }, 5000); // Disappears after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsExiting(true);
    // Aguarda a animação terminar antes de desmontar
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 500);
  };

  const handleWatch = () => {
    onWatch();
    setIsVisible(false);
    onClose();
  };

  if (!isVisible || !data) return null;

  return (
    <div className="fixed top-4 left-0 right-0 z-[110] flex justify-center px-4 pointer-events-none">
      <div 
        className={`pointer-events-auto bg-[#2b2b2b] text-white rounded-lg shadow-2xl w-full max-w-sm flex items-center p-3 gap-3 border border-white/5 ${isExiting ? 'animate-notify-exit' : 'animate-notify-enter'}`}
        role="alert"
        onClick={handleWatch}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0 cursor-pointer">
          <div className="w-10 h-10 rounded-full p-[1px] bg-gradient-to-tr from-purple-500 to-pink-500">
            <img 
                src={data.streamerAvatar} 
                alt={data.streamerName} 
                className="w-full h-full rounded-full object-cover border-2 border-[#2b2b2b]" 
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5">
             <LiveIndicatorIcon className="w-3 h-3 text-green-500" />
          </div>
        </div>

        {/* Text Content */}
        <div className="flex-grow min-w-0 cursor-pointer">
            <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-gray-100 truncate">{data.streamerName}</h4>
            </div>
            <p className="text-gray-400 text-xs truncate">{data.message || "Iniciou uma transmissão ao vivo agora!"}</p>
        </div>

        {/* Close Button */}
        <button 
            onClick={(e) => {
                e.stopPropagation();
                handleClose();
            }}
            className="text-gray-500 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Fechar"
        >
            <CloseIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default LiveNotificationModal;