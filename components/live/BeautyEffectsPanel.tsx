import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon } from '../icons';
import { api } from '../../services/api';
import { BeautySettings, User, ToastType } from '../../types';
import { videoProcessor, BeautyEffectSettings } from '../../services/VideoProcessor';
import { beautyWebRTCIntegration } from '../../services/BeautyWebRTCIntegration';

interface BeautyEffectsPanelProps {
    onClose: () => void;
    currentUser: User;
    addToast: (type: ToastType, message: string) => void;
    videoRef?: React.RefObject<HTMLVideoElement>;
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

const BeautyEffectsPanel: React.FC<BeautyEffectsPanelProps> = ({ onClose, currentUser, addToast, videoRef }) => {
    const [activeTab, setActiveTab] = useState('Beleza');
    const [selectedFilter, setSelectedFilter] = useState('Musa');
    const [selectedEffect, setSelectedEffect] = useState('Branquear');
    const [settings, setSettings] = useState<BeautySettings>({});
    const [effectsData, setEffectsData] = useState<BeautyEffectsData>({ filters: [], effects: [] });
    const [isLoading, setIsLoading] = useState(true);
    const saveTimeout = useRef<number | null>(null);
    const currentFilters = useRef<string>('');

    // Fetch static effects definitions
    useEffect(() => {
        api.getBeautyEffects().then((response: any) => {
            // Lidar com a nova estrutura da API: { data: { filters, effects } }
            const data = response?.data || response || { filters: [], effects: [] };
            setEffectsData(data);
        }).catch(err => {
            console.error('❌ [BEAUTY_PANEL] Erro ao buscar efeitos:', err);
        });
    }, []);

    // Fetch user's saved settings
    useEffect(() => {
        if (currentUser?.id) {
            setIsLoading(true);
            api.getBeautySettings(currentUser.id)
                .then(data => {
                    setSettings(data || {});
                    // Aplicar configurações salvas ao processador de vídeo
                    const beautySettings = convertSettingsToBeautySettings(data || {});
                    videoProcessor.updateBeautySettings(beautySettings);
                    
                    // Iniciar processamento se ainda não estiver ativo
                    if (videoRef?.current && !beautyWebRTCIntegration.isBeautyActive()) {
                        initializeBeautyProcessing();
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch beauty settings:", err);
                    addToast(ToastType.Error, "Não foi possível carregar os efeitos de beleza.");
                })
                .finally(() => setIsLoading(false));
        }
    }, [currentUser, addToast, videoRef]);

    // Inicializar processamento de beleza quando o painel abrir
    useEffect(() => {
        if (videoRef?.current && currentUser?.id) {
            initializeBeautyProcessing();
        }
        
        return () => {
            // Limpar quando o painel fechar
            // Não parar o processamento aqui, pois pode ser usado em outras partes
        };
    }, [videoRef, currentUser]);

    // Converter configurações do formato da API para o formato do VideoProcessor
    const convertSettingsToBeautySettings = (apiSettings: BeautySettings): BeautyEffectSettings => {
        return {
            whitening: apiSettings['Branquear'] || 0,
            smoothing: apiSettings['Alisar a pele'] || 0,
            saturation: apiSettings['Ruborizar'] || 0,
            contrast: apiSettings['Contraste'] || 0
        };
    };

    // Inicializar processamento de beleza
    const initializeBeautyProcessing = async () => {
        try {
            const video = videoRef?.current;
            if (!video) return;

            // Inicializar processador de vídeo
            const success = await videoProcessor.initialize(video);
            if (!success) {
                return;
            }

            // Iniciar processamento
            const processedStream = videoProcessor.startProcessing();
            
            // Configurar integração com WebRTC
            await beautyWebRTCIntegration.initialize(processedStream);
            beautyWebRTCIntegration.toggleBeauty(); // Ativar beleza
            
        } catch (error) {
            console.error('❌ [BEAUTY_PANEL] Erro ao inicializar processamento:', error);
            addToast(ToastType.Error, "Falha ao inicializar efeitos de beleza.");
        }
    };

    // Função para aplicar efeitos CSS diretamente no vídeo
    const applyEffectToVideo = (effectName: string, intensity: number) => {
        const video = videoRef?.current;
        if (!video) return;

        let filterString = currentFilters.current;

        // Mapeamento dos efeitos para filtros CSS
        const effectMap: Record<string, (int: number) => string> = {
            'Branquear': (int) => `brightness(${1 + (int / 100)})`,
            'Alisar a pele': (int) => `blur(${int / 50}px)`,
            'Ruborizar': (int) => `saturate(${1 + (int / 100)})`,
            'Contraste': (int) => `contrast(${1 + (int / 200)})`
        };

        if (effectMap[effectName]) {
            // Adicionar/editar efeito individual
            const newFilter = effectMap[effectName](intensity);
            
            // Remover filtro existente do mesmo tipo
            const filterParts = filterString.split(' ').filter(part => 
                !part.includes('brightness') && !part.includes('blur') && 
                !part.includes('saturate') && !part.includes('contrast')
            );
            
            filterParts.push(newFilter);
            filterString = filterParts.join(' ');
        }

        video.style.filter = filterString;
        currentFilters.current = filterString;
    };

    // Função para aplicar filtro pré-definido
    const applyFilterToVideo = (filterName: string) => {
        const video = videoRef?.current;
        if (!video) return;

        const filterMap: Record<string, string> = {
            'Fechar': 'none',
            'Musa': 'brightness(1.1) saturate(1.2) contrast(1.05)',
            'Bonito': 'brightness(1.15) saturate(1.1) contrast(1.1)',
            'Vitalidade': 'brightness(1.2) saturate(1.3) contrast(1.15)'
        };

        const filterString = filterMap[filterName] || 'none';
        video.style.filter = filterString;
        currentFilters.current = filterString;
    };

    // Debounced save function
    const saveSettings = (newSettings: BeautySettings) => {
        if (saveTimeout.current) {
            clearTimeout(saveTimeout.current);
        }
        saveTimeout.current = window.setTimeout(() => {
            if (currentUser?.id) {
                api.updateBeautySettings(currentUser.id, newSettings)
                    .then(response => {
                        // Success - no sensitive data logged
                    })
                    .catch(err => {
                        console.error('❌ [BEAUTY_PANEL] Erro ao salvar configurações:', err);
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
        
        // Aplicar efeito em tempo real no processador de vídeo
        const beautySettings = convertSettingsToBeautySettings(newSettings);
        videoProcessor.updateBeautySettings(beautySettings);
        
        // Fallback para CSS se o processador não estiver ativo
        if (!beautyWebRTCIntegration.isBeautyActive()) {
            applyEffectToVideo(selectedEffect, value);
        }
    };

    // Handler para seleção de filtros (Recomendar)
    const handleFilterSelect = (filterName: string) => {
        setSelectedFilter(filterName);
        
        // Configurações para filtros pré-definidos
        const filterSettings: Record<string, BeautyEffectSettings> = {
            'Fechar': { whitening: 0, smoothing: 0, saturation: 0, contrast: 0 },
            'Musa': { whitening: 10, smoothing: 15, saturation: 20, contrast: 5 },
            'Bonito': { whitening: 15, smoothing: 20, saturation: 10, contrast: 10 },
            'Vitalidade': { whitening: 20, smoothing: 10, saturation: 30, contrast: 15 }
        };
        
        const selectedSettings = filterSettings[filterName] || filterSettings['Fechar'];
        
        // Converter para o formato da API
        const apiSettings: BeautySettings = {};
        if (selectedSettings.whitening > 0) apiSettings['Branquear'] = selectedSettings.whitening;
        if (selectedSettings.smoothing > 0) apiSettings['Alisar a pele'] = selectedSettings.smoothing;
        if (selectedSettings.saturation > 0) apiSettings['Ruborizar'] = selectedSettings.saturation;
        if (selectedSettings.contrast > 0) apiSettings['Contraste'] = selectedSettings.contrast;
        
        // Salvar na API
        saveSettings(apiSettings);
        
        // Aplicar filtro pré-definido via processador ou CSS
        if (beautyWebRTCIntegration.isBeautyActive()) {
            videoProcessor.updateBeautySettings(selectedSettings);
        } else {
            // Fallback para CSS
            applyFilterToVideo(filterName);
        }
    };

    // Handler para seleção de efeitos (Beleza)
    const handleEffectSelect = (effectName: string) => {
        setSelectedEffect(effectName);
        
        // Aplicar efeito atual com nova intensidade
        const currentIntensity = settings[effectName] || 0;
        
        // Se não tiver intensidade definida, usar um valor padrão
        const newIntensity = currentIntensity || 20; // Valor padrão 20
        const newSettings = {
            ...settings,
            [effectName]: newIntensity
        };
        
        // Salvar na API
        saveSettings(newSettings);
        setSettings(newSettings);
        
        // Aplicar efeito em tempo real
        const beautySettings = convertSettingsToBeautySettings(newSettings);
        videoProcessor.updateBeautySettings(beautySettings);
        
        // Fallback para CSS se necessário
        if (!beautyWebRTCIntegration.isBeautyActive()) {
            applyEffectToVideo(effectName, newIntensity);
        }
    };

    const resetEffects = () => {
        const defaultSettings: BeautySettings = effectsData.effects.reduce((acc, effect) => {
            acc[effect.name] = 20; // Defaulting to 20
            return acc;
        }, {} as BeautySettings);
        
        setSettings(defaultSettings);
        saveSettings(defaultSettings);
        setSelectedFilter('Musa');
        setSelectedEffect('Branquear');
        
        // Resetar processador de vídeo
        videoProcessor.updateBeautySettings({
            whitening: 0,
            smoothing: 0,
            saturation: 0,
            contrast: 0
        });
        
        // Resetar vídeo (fallback CSS)
        const video = videoRef?.current;
        if (video) {
            video.style.filter = 'none';
            currentFilters.current = '';
        }
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
                        <button key={f.name} onClick={() => handleFilterSelect(f.name)} className="flex flex-col items-center space-y-2 focus:outline-none">
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
                             <button key={e.name} onClick={() => handleEffectSelect(e.name)} className="flex flex-col items-center space-y-2 focus:outline-none">
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
