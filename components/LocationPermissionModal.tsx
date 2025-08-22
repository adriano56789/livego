
import React, { useState } from 'react';
import LocationPinSolidIcon from './icons/LocationPinSolidIcon';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onAllow: (accuracy: 'exact' | 'approximate') => void;
  onDeny: () => void;
}

const MapGraphic: React.FC<{ type: 'exact' | 'approximate' }> = ({ type }) => {
  if (type === 'exact') {
    return (
      <div className="w-full h-full bg-[#2c2c2e] rounded-full flex items-center justify-center p-2">
        <div className="w-full h-full border-2 border-dashed border-gray-500 rounded-full relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-blue-500 rounded-full border-2 border-white"></div>
        </div>
      </div>
    );
  }
  return (
     <div className="w-full h-full bg-[#2c2c2e] rounded-full flex items-center justify-center p-2">
        <div className="w-full h-full border-2 border-solid border-blue-500/50 rounded-full relative opacity-50">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/30 rounded-full"></div>
        </div>
      </div>
  );
};


const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({ isOpen, onAllow, onDeny }) => {
  const [accuracy, setAccuracy] = useState<'exact' | 'approximate'>('exact');

  if (!isOpen) {
    return null;
  }
  
  const handleAllow = (type: 'always' | 'once') => {
      // For this simulation, both 'always' and 'once' behave the same.
      onAllow(accuracy);
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center"
      onClick={onDeny}
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-permission-title"
    >
      <div
        className="bg-[#1c1c1e] w-full max-w-md rounded-t-2xl p-6 flex flex-col gap-6 shadow-lg animate-slide-up-fast"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-[#2c2c2e] rounded-xl flex items-center justify-center mb-4">
                <LocationPinSolidIcon className="w-8 h-8 text-gray-400"/>
            </div>
            <h2 id="location-permission-title" className="text-xl font-semibold text-white">
                Permitir que o app "LiveGo" acesse a localização deste dispositivo?
            </h2>
        </div>

        <div className="flex justify-around items-start gap-4">
            <button onClick={() => setAccuracy('exact')} className="flex-1 flex flex-col items-center gap-2">
                <div className={`w-28 h-28 p-1 rounded-full transition-all ${accuracy === 'exact' ? 'border-2 border-blue-500' : 'border-2 border-transparent'}`}>
                    <MapGraphic type="exact" />
                </div>
                <span className={`font-semibold ${accuracy === 'exact' ? 'text-blue-400' : 'text-white'}`}>Exata</span>
            </button>
             <button onClick={() => setAccuracy('approximate')} className="flex-1 flex flex-col items-center gap-2">
                <div className={`w-28 h-28 p-1 rounded-full transition-all ${accuracy === 'approximate' ? 'border-2 border-blue-500' : 'border-2 border-transparent'}`}>
                    <MapGraphic type="approximate" />
                </div>
                <span className={`font-semibold ${accuracy === 'approximate' ? 'text-blue-400' : 'text-white'}`}>Aproximada</span>
            </button>
        </div>
        
        <div className="flex flex-col gap-3">
             <button
                onClick={() => handleAllow('always')}
                className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl text-lg hover:bg-blue-500 transition-colors"
            >
                Durante o uso do app
            </button>
             <button
                onClick={() => handleAllow('once')}
                className="w-full bg-[#2c2c2e] text-white font-semibold py-3.5 rounded-xl text-lg hover:bg-gray-700 transition-colors"
            >
                Apenas esta vez
            </button>
             <button
                onClick={onDeny}
                className="w-full bg-[#2c2c2e] text-white font-semibold py-3.5 rounded-xl text-lg hover:bg-gray-700 transition-colors"
            >
                Não permitir
            </button>
        </div>
      </div>
      <style>{`
        @keyframes slide-up-fast { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up-fast { animation: slide-up-fast 0.25s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default LocationPermissionModal;
