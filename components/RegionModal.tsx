import React, { useState } from 'react';
import { CloseIcon, GlobalRegionIcon, BrazilFlagIcon, ColombiaFlagIcon, USAFlagIcon, MexicoFlagIcon, ArgentinaFlagIcon, SpainFlagIcon, PhilippinesFlagIcon, VietnamFlagIcon, IndiaFlagIcon, IndonesiaFlagIcon, TurkeyFlagIcon } from './icons';

interface RegionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectRegion: (id: string) => void;
}

const RegionModal: React.FC<RegionModalProps> = ({ isOpen, onClose, onSelectRegion }) => {
    // FIX: Add conditional rendering based on the isOpen prop.
    if (!isOpen) return null;
    
    const regions = [
        { id: 'global', name: 'Global', icon: <GlobalRegionIcon /> },
        { id: 'br', name: 'Brasil', icon: <BrazilFlagIcon className="rounded-[3px]" /> },
        { id: 'co', name: 'Colômbia', icon: <ColombiaFlagIcon className="rounded-[3px]" /> },
        { id: 'us', name: 'EUA', icon: <USAFlagIcon className="rounded-[3px]" /> },
        { id: 'mx', name: 'México', icon: <MexicoFlagIcon className="rounded-[3px]" /> },
        { id: 'ar', name: 'Argentina', icon: <ArgentinaFlagIcon className="rounded-[3px]" /> },
        { id: 'es', name: 'Espanha', icon: <SpainFlagIcon className="rounded-[3px]" /> },
        { id: 'ph', name: 'Filipinas', icon: <PhilippinesFlagIcon className="rounded-[3px]" /> },
        { id: 'vn', name: 'Vietnã', icon: <VietnamFlagIcon className="rounded-[3px]" /> },
        { id: 'in', name: 'Índia', icon: <IndiaFlagIcon className="rounded-[3px]" /> },
        { id: 'id', name: 'Indonésia', icon: <IndonesiaFlagIcon className="rounded-[3px]" /> },
        { id: 'tr', name: 'Turquia', icon: <TurkeyFlagIcon className="rounded-[3px]" /> },
    ];

    const [selectedRegion, setSelectedRegion] = useState('global');

    return (
        <div className="fixed inset-0 z-[120] flex items-end bg-transparent" onClick={onClose}>
            <div 
                className="bg-[#1C1C1E] w-full rounded-t-2xl p-4 animate-in slide-in-from-bottom duration-300"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-white text-lg font-bold">Selecione uma região</h2>
                    <button onClick={onClose} className="p-1">
                        <CloseIcon className="text-gray-400 w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                    {regions.map((region) => (
                        <button 
                            key={region.id}
                            className="flex flex-col items-center gap-2 group"
                            onClick={() => {
                                setSelectedRegion(region.id);
                                onSelectRegion(region.id);
                                setTimeout(onClose, 150);
                            }}
                        >
                            <div className={`relative flex items-center justify-center transition-transform active:scale-95 ${region.id === 'global' ? 'w-10 h-10' : 'w-9 h-[22px]'}`}>
                                {region.icon}
                                {selectedRegion === region.id && (
                                    <div className={`absolute -inset-1 ring-2 ring-[#007AFF] rounded-[6px] pointer-events-none`}></div>
                                )}
                            </div>
                            <span className={`text-[11px] font-medium text-center ${selectedRegion === region.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>
                                {region.name}
                            </span>
                        </button>
                    ))}
                </div>
                <div className="h-6"></div>
            </div>
        </div>
    );
};

export default RegionModal;