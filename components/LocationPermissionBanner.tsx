
import React from 'react';
import LocationPinSolidIcon from './icons/LocationPinSolidIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface LocationPermissionBannerProps {
  onClick: () => void;
}

const LocationPermissionBanner: React.FC<LocationPermissionBannerProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full bg-purple-900/50 border border-purple-500/30 text-purple-200 p-3 rounded-lg flex items-center justify-between text-left mb-2 shrink-0"
    >
      <div className="flex items-center gap-3">
        <LocationPinSolidIcon className="w-6 h-6 text-purple-400" />
        <span className="font-medium text-sm">
          Para obter uma recomendação precisa, ative a permissão de posicionamento.
        </span>
      </div>
      <ChevronRightIcon className="w-5 h-5" />
    </button>
  );
};

export default LocationPermissionBanner;
