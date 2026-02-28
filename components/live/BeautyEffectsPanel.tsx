import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon } from '../icons';
import { api } from '../../services/api';
import { BeautySettings, User, ToastType } from '../../types';

interface BeautyEffectsPanelProps {
    onClose: () => void;
    currentUser: User;
    addToast: (type: ToastType, message: string) => void;
}

interface BeautyEffect {
  name: string;
  icon?: string;
  img?: string;
}

interface BeautyEffectsData {
  filters: BeautyEffect[];
  effects: BeautyEffect[];
}

const BeautyEffectsPanel: React.FC<BeautyEffectsPanelProps> = ({ onClose, currentUser, addToast }) => {
    const [activeTab, setActiveTab] = useState('Beleza');
    const [selectedFilter, setSelectedFilter] = useState('Musa');
    const [selectedEffect, setSelectedEffect] = useState('Branquear');
    const [settings, setSettings] = useState<BeautySettings>({});
    const [effectsData, setEffectsData] = useState<BeautyEffectsData>({ filters: [], effects: [] });
    const [isLoading, setIsLoading] = useState(true);
    const saveTimeout = useRef<number | null>(null);

    // Fetch static effects definitions
    useEffect(() => {
        api.getBeautyEffects().then(data => setEffectsData(data || { filters: [], effects: [] })).catch(err => console.error("Failed to fetch beauty effects:", err));
    }, []);

    // Fetch user's saved settings
    useEffect(() => {
        if (currentUser?.id) {
            setIsLoading(true);
            api.getBeautySettings(currentUser.id)
                .then(data => {
                    setSettings(data || {});
                })
                .catch(err => {
                    console.error("Failed to fetch beauty settings:", err);
                    addToast(ToastType.Error, "Não foi possível carregar os efeitos de beleza.");
                })
                .finally(() => setIsLoading(false));
        }
    }, [currentUser, addToast]);

    // Debounced save function
    const saveSettings = (newSettings: BeautySettings) => {
        if (saveTimeout.current) {
            clearTimeout(saveTimeout.current);
        }
        saveTimeout.current = window.setTimeout(() => {
            if (currentUser?.id) {
                api.updateBeautySettings(currentUser.id, newSettings).catch(() => {
                    addToast(ToastType.Error, "Falha ao salvar o efeito.");
                });
            }
        }, 500);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeout.current) {
                clearTimeout(saveTimeout.current);
            }
        };
    }, []);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        const newSettings = {
            ...settings,
            [selectedEffect]: value
        };
        setSettings(newSettings);
        saveSettings(newSettings);
    };

    const resetEffects = () => {
        const defaultSettings: BeautySettings = effectsData.effects.reduce((acc, effect) => {
            acc[effect.name] = 20; // Defaulting to 20
            return acc;
        }, {} as BeautySettings);
        
        setSettings(defaultSettings);
        saveSettings(defaultSettings); // Save the reset state
        setSelectedFilter('Musa');
        setSelectedEffect('Branquear');
    };
    
    const currentEffectValue = settings[selectedEffect] ?? 0;

    return (
         <div className="absolute inset-x-0 bottom-0 bg-[#222225] rounded-t-2xl z-50 p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                    <button onClick={() => setActiveTab('Recomendar')} className={`transition-colors ${activeTab === 'Recomendar' ? 'text-white' : 'text-gray-500 hover:text-white'}`}>Recomendar</button>
                    <button onClick={() => setActiveTab('Beleza')} className={`transition-colors ${activeTab === 'Beleza' ? 'text-white' : 'text-gray-500 hover:text-white'}`}>Beleza</button>
                </div>
                <div className="flex items-center space-x-4">
                    <button onClick={resetEffects} className="text-sm text-gray-400 hover:text-white">Redefinir</button>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
            {activeTab === 'Recomendar' && (
                <div className="flex justify-around items-center text-center">
                    {effectsData.filters.map(f => (
                        <button key={f.name} onClick={() => setSelectedFilter(f.name)} className="flex flex-col items-center space-y-2 focus:outline-none">
                            {f.img ? 
                                <img src={f.img} alt={f.name} className={`w-12 h-12 rounded-lg object-cover border-2 transition-all ${selectedFilter === f.name ? 'border-purple-500' : 'border-transparent'}`} /> : 
                                <div className={`w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center text-xl border-2 transition-all ${selectedFilter === f.name ? 'border-purple-500' : 'border-transparent'}`}>{f.icon}</div>
                            }
                            <span className={`text-xs transition-colors ${selectedFilter === f.name ? 'text-purple-400' : 'text-gray-300'}`}>{f.name}</span>
                        </button>
                    ))}
                </div>
            )}
            {activeTab === 'Beleza' && (
                <div>
                     <div className="flex items-center space-x-3 mb-4">
                        <span className="text-white w-6 text-center">{currentEffectValue}</span>
                        <input type="range" min="0" max="100" value={currentEffectValue} onChange={handleSliderChange} disabled={isLoading} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50" />
                    </div>
                     <div className="flex justify-around items-center text-center">
                        {effectsData.effects.map((e) => (
                             <button key={e.name} onClick={() => setSelectedEffect(e.name)} className="flex flex-col items-center space-y-2 focus:outline-none">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl transition-colors ${selectedEffect === e.name ? 'bg-purple-600' : 'bg-gray-700'}`}>
                                    {e.icon}
                                </div>
                                <span className={`text-xs transition-colors ${selectedEffect === e.name ? 'text-purple-400' : 'text-gray-300'}`}>{e.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BeautyEffectsPanel;