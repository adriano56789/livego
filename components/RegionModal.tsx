
import React, { useState } from 'react';
import { Country } from '../types';
import { CloseIcon, GlobeIcon } from './icons';
import { useTranslation } from '../i18n';

interface RegionModalProps {
  isOpen: boolean;
  onClose: () => void;
  countries: Country[];
  selectedCountryCode: string;
  onSelectRegion: (countryCode: string) => void;
}

const RegionModal: React.FC<RegionModalProps> = ({ isOpen, onClose, countries, selectedCountryCode, onSelectRegion }) => {
  const { t } = useTranslation();

  return (
    <div 
      className={`absolute inset-0 z-40 flex items-end justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose}
    >
      <div
        className={`bg-[#1C1C1E] w-full max-w-md rounded-t-2xl p-3 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-200">{t('region.select')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>
        <div className="grid grid-cols-4 gap-2 text-center">
          {countries.map((country) => (
            <button
              key={country.code}
              onClick={() => onSelectRegion(country.code)}
              className="flex flex-col items-center space-y-1 group focus:outline-none"
            >
              <div className={`relative w-12 h-12 flex items-center justify-center rounded-lg bg-[#2C2C2E] overflow-hidden transition-all group-hover:bg-gray-700 ${
                  selectedCountryCode === country.code
                    ? 'border-2 border-blue-500'
                    : 'border-2 border-transparent'
                }`}
              >
                {country.code === 'ICON_GLOBE' ? (
                  <GlobeIcon className="w-6 h-6 text-gray-200" />
                ) : (
                  <img src={`https://flagcdn.com/${country.code}.svg`} alt={country.name} className="w-full h-full object-cover" />
                )}
              </div>
              <span className={`text-xs ${selectedCountryCode === country.code ? 'text-white font-medium' : 'text-gray-400'}`}>{country.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RegionModal;