
import React from 'react';
import { useTranslation } from '../i18n';
import { MapMarkerAltIcon } from './icons/MapMarkerAltIcon';
import { MapMarkerIcon } from './icons/MapMarkerIcon';

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
      className="fixed inset-0 z-[100] flex items-end justify-center"
      aria-modal="true"
      role="dialog"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}
    >
      <div className="bg-white dark:bg-[#2c2c2e] rounded-t-3xl p-6 w-full max-w-md text-center text-gray-800 dark:text-white shadow-lg">
        <div className="flex justify-center mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <MapMarkerAltIcon size="1.5rem" color="#3b82f6" />
            </div>
        </div>
        <h2 className="text-lg font-semibold mb-6">{t('locationPermission.title')}</h2>
        
        <div className="flex justify-around items-start text-center mb-6 space-x-4">
            <div className="flex flex-col items-center flex-1">
                <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                    <MapMarkerAltIcon size="2.5rem" color="#3b82f6" />
                </div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('locationPermission.precise')}</p>
            </div>
            <div className="flex flex-col items-center flex-1">
                <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
                    <MapMarkerIcon size="2.5rem" color="#a855f7" />
                </div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('locationPermission.approximate')}</p>
            </div>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={onAllow}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl py-3 px-4 text-base transition-colors"
          >
            {t('locationPermission.whileUsing')}
          </button>
          <button
            onClick={onAllowOnce}
            className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-xl py-3 px-4 text-base transition-colors"
          >
            {t('locationPermission.onlyThisTime')}
          </button>
          <button
            onClick={onDeny}
            className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-xl py-3 px-4 text-base transition-colors"
          >
            {t('locationPermission.deny')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPermissionModal;
