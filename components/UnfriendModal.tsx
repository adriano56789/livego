

import React from 'react';
import { useTranslation } from '../i18n';

interface UnfriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnfriend: () => void;
  onBlock: () => void;
}

const UnfriendModal: React.FC<UnfriendModalProps> = ({ isOpen, onClose, onUnfriend, onBlock }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div 
        className="absolute inset-0 z-50 flex items-end justify-center transition-opacity" 
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
        <div className="w-full max-w-md p-4 space-y-2" onClick={e => e.stopPropagation()}>
            <div className="bg-[#2a2a2c] rounded-xl overflow-hidden">
                <button 
                    onClick={onUnfriend} 
                    className="w-full p-4 text-red-500 text-center font-semibold text-lg hover:bg-gray-700/50 transition-colors"
                >
                    {t('common.unfriend')}
                </button>
                <div className="h-px bg-gray-600/50"></div>
                <button 
                    onClick={onBlock} 
                    className="w-full p-4 text-white text-center font-semibold text-lg hover:bg-gray-700/50 transition-colors"
                >
                    {t('common.block')}
                </button>
            </div>
            <div className="bg-[#2a2a2c] rounded-xl">
                <button 
                    onClick={onClose} 
                    className="w-full p-4 text-blue-400 text-center font-semibold text-lg hover:bg-gray-700/50 transition-colors"
                >
                    {t('common.cancel')}
                </button>
            </div>
        </div>
    </div>
  );
};

export default UnfriendModal;