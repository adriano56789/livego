
import React from 'react';
import { CloseIcon, CheckIcon } from '../icons';

interface ResolutionPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectResolution: (resolution: string) => void;
    currentResolution: string;
}

const qualityOptions = [
    { key: '720p', label: '720p (HD)' },
    { key: '480p', label: '480p (Padrão)' },
    { key: '360p', label: '360p (Fluente)' },
];

const ResolutionPanel: React.FC<ResolutionPanelProps> = ({ isOpen, onClose, onSelectResolution, currentResolution }) => {
    return (
        <div 
            className={`absolute inset-0 z-50 flex items-end justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
            onClick={onClose}
        >
            <div
                className={`bg-[#302f34] w-full max-w-md rounded-t-2xl shadow-xl text-white transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 flex justify-between items-center">
                    <h2 className="text-lg font-bold">Qualidade do Vídeo</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="px-4 pb-5">
                    <p className="text-gray-400 text-sm mb-6">Ajustar a qualidade pode afetar o uso de dados e a fluidez da transmissão.</p>
                    <div className="space-y-3">
                        {qualityOptions.map((option) => (
                            <button
                                key={option.key}
                                onClick={() => onSelectResolution(option.key)}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex justify-between items-center text-base ${
                                    currentResolution === option.key
                                        ? 'bg-purple-600 text-white shadow-lg'
                                        : 'text-gray-200 hover:bg-white/10'
                                }`}
                            >
                                <span className="font-medium">{option.label}</span>
                                {currentResolution === option.key && <CheckIcon className="w-5 h-5" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResolutionPanel;
