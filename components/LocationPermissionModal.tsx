
import React from 'react';
import { LocationPinIcon, BuzzCastLogoIcon } from './icons';
import { useTranslation } from '../i18n';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onAllow: () => void;
  onAllowOnce: () => void;
  onDeny: () => void;
}

const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({ isOpen, onAllow, onAllowOnce, onDeny }) => {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 z-[100] flex items-end justify-center bg-black/60"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-[#2c2c2e] rounded-t-3xl p-6 w-full max-w-md text-center text-white">
        <div className="flex justify-center mb-4">
            <div className="p-2 bg-gray-700 rounded-full">
                <LocationPinIcon className="w-6 h-6 text-gray-300" />
            </div>
        </div>
        <h2 className="text-lg font-semibold mb-6">{t('locationPermission.title')}</h2>
        
        <div className="flex justify-around items-start text-center mb-6">
            <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-600 mb-2 overflow-hidden relative">
                    <img src="https://i.imgur.com/8Y3t3o6.png" className="w-full h-full object-cover" alt="Precise location map" />
                </div>
                <p className="text-sm">{t('locationPermission.precise')}</p>
            </div>
             <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-600 mb-2 overflow-hidden">
                    <img src="https://i.imgur.com/G5iBE0M.png" className="w-full h-full object-cover" alt="Approximate location map" />
                </div>
                <p className="text-sm">{t('locationPermission.approximate')}</p>
            </div>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={onAllow}
            className="w-full bg-[#007aff] text-white font-semibold rounded-xl py-3 px-4 text-base hover:bg-blue-600 transition-colors"
          >
            {t('locationPermission.whileUsing')}
          </button>
          <button
            onClick={onAllowOnce}
            className="w-full bg-[#3c3c3e] text-white font-semibold rounded-xl py-3 px-4 text-base hover:bg-gray-700 transition-colors"
          >
            {t('locationPermission.onlyThisTime')}
          </button>
          <button
            onClick={onDeny}
            className="w-full bg-[#3c3c3e] text-white font-semibold rounded-xl py-3 px-4 text-base hover:bg-gray-700 transition-colors"
          >
            {t('locationPermission.deny')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPermissionModal;
