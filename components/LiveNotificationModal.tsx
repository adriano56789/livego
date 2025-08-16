
import React, { useEffect } from 'react';
import CrossIcon from './icons/CrossIcon';
import BuzzCastIcon from './icons/BuzzCastIcon';

interface LiveNotificationModalProps {
  streamerName: string;
  streamerAvatarUrl: string;
  onWatch: () => void;
  onClose: () => void;
}

const LiveNotificationModal: React.FC<LiveNotificationModalProps> = ({ streamerName, streamerAvatarUrl, onWatch, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 10000); // Auto-dismiss after 10 seconds

    return () => clearTimeout(timer);
  }, [onClose]);
  
  const handleWatchClick = () => {
    onWatch();
  };

  return (
    <div 
      className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-[calc(100%-2rem)] sm:max-w-sm z-[100] animate-slide-down-fade"
      role="alert"
      aria-live="assertive"
    >
      <button onClick={handleWatchClick} className="w-full text-left bg-white rounded-xl p-3 shadow-lg flex flex-col gap-3 text-black hover:bg-gray-100/90 transition-colors">
        <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
                <BuzzCastIcon className="w-5 h-5" />
                <span className="font-semibold">LiveGo</span>
            </div>
            <span>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex items-center gap-3">
          <img src={streamerAvatarUrl} alt={streamerName} className="w-12 h-12 rounded-full object-cover" />
          <div className="flex-grow">
            <p className="font-semibold text-gray-800">{streamerName} <span className="font-normal text-gray-600">está ao vivo agora!</span></p>
          </div>
        </div>
      </button>
      <style>{`
        @keyframes slide-down-fade {
          0% { opacity: 0; transform: translate(-50%, -20px); }
          100% { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-slide-down-fade { animation: slide-down-fade 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default LiveNotificationModal;