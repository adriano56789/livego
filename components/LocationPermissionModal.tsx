
import React, { useState, useEffect } from 'react';
import { LocationPinIcon, LiveGoLogo } from './icons';
import { useTranslation } from '../i18n';
import { api } from '../services/api';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onAllow: () => void;
  onAllowOnce: () => void;
  onDeny: () => void;
}

const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({ isOpen, onAllow, onAllowOnce, onDeny }) => {
  const { t } = useTranslation();
  const [locationData, setLocationData] = useState<{
    location: any;
    permission: string;
    showLocation: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLocationData();
    }
  }, [isOpen]);

  const loadLocationData = async () => {
    try {
      setIsLoading(true);
      const response = await api.getUserLocation();
      if (response.success) {
        setLocationData({
          location: response.location,
          permission: response.permission,
          showLocation: response.showLocation
        });
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

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
            <div className="w-16 h-16">
                <LiveGoLogo className="w-full h-full" />
            </div>
        </div>
        <h2 className="text-lg font-semibold mb-6">{t('locationPermission.title')}</h2>
        
        {isLoading && (
          <div className="mb-6 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            <p className="text-sm text-gray-400 mt-2">Carregando informações de localização...</p>
          </div>
        )}

        {!isLoading && locationData && (
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-300 mb-2">
              Status atual: {locationData.permission === 'granted' ? 'Permitido' : locationData.permission === 'denied' ? 'Negado' : 'Pendente'}
            </p>
            {locationData.location && locationData.location.coordinates && (
              <p className="text-xs text-gray-400">
                Localização salva: [{locationData.location.coordinates[1]?.toFixed(4) || 'N/A'}, {locationData.location.coordinates[0]?.toFixed(4) || 'N/A'}]
              </p>
            )}
          </div>
        )}
        
        <div className="flex justify-around items-start text-center mb-6">
            <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-600 mb-2 overflow-hidden relative flex items-center justify-center">
                    <svg className="w-12 h-12 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <div className="absolute bottom-1 right-1 w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
                <p className="text-sm">{t('locationPermission.precise')}</p>
            </div>
             <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-600 mb-2 overflow-hidden relative flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <div className="absolute bottom-1 right-1 w-3 h-3 bg-yellow-400 rounded-full opacity-60"></div>
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
