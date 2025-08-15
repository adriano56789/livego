import React, { useEffect } from 'react';
import PlayIcon from './icons/PlayIcon';
import CrossIcon from './icons/CrossIcon';

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
    }, 7000); // Auto-dismiss after 7 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div 
      className="fixed top-16 left-1/2 -translate-x-1/2 w-full max-w-sm p-2 z-50 animate-slide-down-fade"
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-gradient-to-br from-[#1E1B4B] to-[#141026] rounded-xl p-3 shadow-2xl border border-purple-500/30 flex items-center gap-3">
        <img src={streamerAvatarUrl} alt={streamerName} className="w-12 h-12 rounded-full object-cover border-2 border-purple-400" />
        
        <div className="flex-grow">
          <p className="font-bold text-white">{streamerName}</p>
          <p className="text-sm text-gray-300">está ao vivo agora!</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onWatch}
            className="bg-green-500 text-black px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-1.5 hover:bg-green-400 transition-colors"
          >
            <PlayIcon className="w-4 h-4" />
            Ver
          </button>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <CrossIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slide-down-fade {
          0% {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slide-down-fade {
          animation: slide-down-fade 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LiveNotificationModal;
