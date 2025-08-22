

import React, { useState, useEffect } from 'react';
import CrossIcon from './icons/CrossIcon';
import type { Region } from '../types';
import Flag from './Flag';
import * as liveStreamService from '../services/liveStreamService';

interface RegionSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (region: Region) => void;
}

const RegionSelectionModal: React.FC<RegionSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      liveStreamService.getRegions()
        .then(data => setRegions(data))
        .catch(err => console.error("Failed to fetch regions", err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-transparent flex items-end justify-center animate-fade-in-fast" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="region-modal-title">
      <div 
        className="bg-gray-900 border-t border-gray-700 rounded-t-2xl w-full max-w-md p-4 flex flex-col gap-4 shadow-lg animate-slide-up-fast"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center text-white">
          <h2 id="region-modal-title" className="text-lg font-bold">Áreas recomendadas</h2>
          <button onClick={onClose} className="p-1 -m-1 text-gray-500 hover:text-white" aria-label="Fechar">
            <CrossIcon className="w-6 h-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 text-center">
            {regions.map(region => (
              <button key={region.code} onClick={() => onSelect(region)} className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500">
                <div className="w-12 h-12 shadow-md rounded-lg overflow-hidden border border-gray-700 flex items-center justify-center">
                  <Flag code={region.code} className="w-full h-auto" />
                </div>
                <span className="text-sm font-medium text-gray-200">{region.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <style>{`
        @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
        @keyframes slide-up-fast { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up-fast { animation: slide-up-fast 0.25s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default RegionSelectionModal;