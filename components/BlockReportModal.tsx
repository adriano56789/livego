
import React from 'react';
import { useTranslation } from '../i18n';

interface BlockReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBlock: () => void;
  onReport: () => void;
  onUnfriend?: () => void;
}

const BlockReportModal: React.FC<BlockReportModalProps> = ({ isOpen, onClose, onBlock, onReport, onUnfriend }) => {
  const { t } = useTranslation();
  return (
    <div 
        className={`absolute inset-0 z-50 flex items-end justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
        <div 
            className={`w-full max-w-md transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
            onClick={e => e.stopPropagation()}
        >
            <div className="px-2 pb-2 space-y-2">
                <div className="bg-[#2a2a2c] rounded-xl overflow-hidden">
                    {onUnfriend && (
                       <>
                        <button 
                            onClick={onUnfriend} 
                            className="w-full py-3 text-red-500 text-center text-lg font-bold hover:bg-gray-700/50 transition-colors"
                        >
                            {t('common.unfriend')}
                        </button>
                        <div className="h-px bg-gray-600/50"></div>
                       </>
                    )}
                    <button 
                        onClick={onBlock} 
                        className="w-full py-3 text-red-500 text-center text-lg font-bold hover:bg-gray-700/50 transition-colors"
                    >
                        {t('common.block')}
                    </button>
                    <div className="h-px bg-gray-600/50"></div>
                    <button 
                        onClick={onReport} 
                        className="w-full py-3 text-white text-center text-lg font-bold hover:bg-gray-700/50 transition-colors"
                    >
                        {t('common.report')}
                    </button>
                </div>
                <div className="bg-[#2a2a2c] rounded-xl">
                    <button 
                        onClick={onClose} 
                        className="w-full py-3 text-white text-center text-lg font-bold hover:bg-gray-700/50 transition-colors"
                    >
                        {t('common.cancel')}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default BlockReportModal;