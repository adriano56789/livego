
import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon, ExpandIcon, BookOpenIcon, SparklesIcon, PKIcon, ChevronRightIcon, LockIcon } from './components/icons';
import { Streamer, ToastType, User, BeautySettings } from './types';
import BeautyEffectsPanel from './components/live/BeautyEffectsPanel';
import LiveStreamManualModal from './components/live/LiveStreamManualModal';
import { useTranslation } from './i18n';
import { api } from './services/api';

interface GoLiveScreenProps { 
  isOpen: boolean;
  onClose: () => void;
  onStartStream: (streamer: Streamer) => void;
  addToast: (type: ToastType, message: string) => void;
  currentUser: User;
}

interface Category {
    key: string;
    label: string;
}

interface CategoryModalProps {
  onClose: () => void;
  onSelectCategory: (categoryKey: string) => void;
  selectedCategoryKey: string;
  categories: Category[];
}

const CategoryModal: React.FC<CategoryModalProps> = ({ onClose, onSelectCategory, selectedCategoryKey, categories }) => {
    return (
        <div className="absolute inset-x-0 bottom-0 bg-[#1C1C1E] rounded-t-3xl z-50 p-6 pb-10 shadow-2xl border-t border-white/10" onClick={e => e.stopPropagation()}>
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Selecionar Categoria</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white bg-white/10 p-2 rounded-full transition-colors">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {categories.map((cat) => (
                    <button 
                        key={cat.key}
                        onClick={() => onSelectCategory(cat.key)}
                        className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all duration-200 ${selectedCategoryKey === cat.key ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                        {cat.label}
                    </button>
                ))}
            </div>
        </div>
    );
};


export const GoLiveScreen: React.FC<GoLiveScreenProps> = ({ isOpen, onClose, onStartStream, addToast, currentUser }) => {
  const { t } = useTranslation();
  const [isUiVisible, setIsUiVisible] = useState(true);
  const [streamType, setStreamType] = useState('WebRTC');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  const categories: Category[] = [
      { key: 'popular', label: t('goLive.category.popular') },
      { key: 'followed', label: t('goLive.category.followed') },
      { key: 'nearby', label: t('goLive.category.nearby') },
      { key: 'pk', label: t('goLive.category.pk') },
      { key: 'new', label: t('goLive.category.new') },
      { key: 'music', label: t('goLive.category.music') },
      { key: 'dance', label: t('goLive.category.dance') },
      { key: 'party', label: t('goLive.category.party') },
      { key: 'private', label: t('goLive.category.private') }
  ];

  const [selectedCategoryKey, setSelectedCategoryKey] = useState(categories[0].key);
  const [isBeautyPanelOpen, setIsBeautyPanelOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [draftStream, setDraftStream] = useState<Streamer | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const setupStream = async () => {
        if (isOpen) {
            // Create a draft stream as soon as the screen opens
            try {
                const newDraft = await api.createStream({});
                if (!newDraft) {
                    throw new Error("API failed to return a stream draft.");
                }
                setDraftStream(newDraft);
                setStreamTitle(newDraft.name);
                setStreamDescription(newDraft.message);
            } catch (error) {
                console.error("Error setting up stream:", error);
                addToast(ToastType.Error, "Falha ao criar rascunho da live.");
                onClose();
            }

            // Setup camera with 1080p constraints
            navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30, min: 24 },
                    facingMode: 'user' 
                }, 
                audio: true 
            })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    // Debug: Check resolution
                    const track = stream.getVideoTracks()[0];
                    const settings = track.getSettings();
                    console.log(`Camera initialized at: ${settings.width}x${settings.height}`);
                }
            })
            .catch(err => {
                console.error("Error accessing camera with 1080p constraints, falling back to default:", err);
                 // Fallback to default constraints if 1080p fails
                 navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                 .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                 })
                 .catch(fallbackErr => console.error("Error accessing camera (fallback):", fallbackErr));
            });
        } else {
            // Cleanup when component closes
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
            setDraftStream(null);
            setStreamTitle('');
            setStreamDescription('');
        }
    };
    setupStream();
  }, [isOpen, addToast, onClose]);

  const hideUi = () => {
    setIsUiVisible(false);
  };

  const showUi = () => {
    if (isCategoryModalOpen || isBeautyPanelOpen) return;
    if (!isUiVisible) {
      setIsUiVisible(true);
    }
  };

  const handleSelectCategory = (categoryKey: string) => {
    setSelectedCategoryKey(categoryKey);
    setIsCategoryModalOpen(false);
  };

  const handleSaveChanges = async () => {
    if (!draftStream) return;
    try {
        const { success, stream } = await api.saveStream(draftStream.id, { name: streamTitle, message: streamDescription, tags: [selectedCategoryKey] });
        if(success && stream) {
            setDraftStream(stream);
            addToast(ToastType.Success, "Detalhes da live salvos!");
        } else {
            throw new Error("API failed to save");
        }
    } catch (error) {
        addToast(ToastType.Error, "Falha ao salvar detalhes.");
    }
  };
  
  const handleAddCover = async () => {
    if (!draftStream) return;
    try {
        const { success, stream } = await api.uploadStreamCover(draftStream.id, {});
        if (success && stream) {
            setDraftStream(stream);
            addToast(ToastType.Success, "Capa da live atualizada!");
        } else {
            throw new Error("API failed to upload cover");
        }
    } catch (error) {
        addToast(ToastType.Error, "Falha ao alterar a capa.");
    }
  };

  const handleInitiateStream = async () => {
    if (!draftStream) {
        addToast(ToastType.Error, "Rascunho da live não encontrado.");
        return;
    }
    try {
      const finalIsPrivate = isPrivate || selectedCategoryKey === 'private';
      const finalTags = Array.from(new Set([selectedCategoryKey, ...(finalIsPrivate ? ['private'] : [])]));
      
      const { success, stream } = await api.saveStream(draftStream.id, { 
          name: streamTitle, 
          message: streamDescription, 
          isPrivate: finalIsPrivate,
          tags: finalTags
      });
      if (success && stream) {
          onStartStream(stream);
      } else {
          throw new Error("Failed to save stream before starting.");
      }
    } catch (error) {
      addToast(ToastType.Error, "Falha ao iniciar a transmissão.");
    }
  };
  
  const StreamTypeButton: React.FC<{type: string}> = ({ type }) => (
    <button
        onClick={() => setStreamType(type)}
        className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${streamType === type ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
    >
        {type}
    </button>
  );
  
  const selectedCategoryLabel = categories.find(c => c.key === selectedCategoryKey)?.label || selectedCategoryKey;

  return (
    <div
      className={`absolute inset-0 bg-black z-50 transition-opacity duration-500 flex flex-col justify-between font-sans ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover -z-10"></video>
      
      {/* Overlay Gradient for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none"></div>

      <div className="absolute inset-0" onClick={showUi}></div>

      <header className={`absolute top-0 right-0 p-6 flex items-center space-x-3 z-20`}>
        <button onClick={hideUi} className={`w-10 h-10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-opacity duration-300 hover:bg-black/50 ${isUiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <ExpandIcon className="w-5 h-5" />
        </button>
        <button onClick={onClose} className="w-10 h-10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/50">
          <CloseIcon className="w-6 h-6" />
        </button>
      </header>
      
      <div 
        className={`z-10 w-full max-w-md mx-auto transition-all duration-500 ease-in-out transform ${isUiVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 space-y-6">
            
            {/* Top Section: Cover, Title, Category */}
            <div className="flex items-start space-x-4">
                <button onClick={handleAddCover} className="group relative w-24 h-24 bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/10 flex flex-col items-center justify-center text-gray-300 overflow-hidden transition-transform active:scale-95">
                    {draftStream?.avatar ? (
                        <img src={draftStream.avatar} alt="Capa da Live" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                        <div className="flex flex-col items-center">
                             <span className="text-3xl font-light mb-1">+</span>
                             <span className="text-[10px] font-medium uppercase tracking-wide">{t('goLive.addCover')}</span>
                        </div>
                    )}
                    {draftStream?.avatar && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                             <span className="text-white font-medium text-xs">{t('common.edit')}</span>
                        </div>
                    )}
                </button>
                
                <div className="flex-grow flex flex-col justify-between h-24 py-1">
                    <div className="space-y-3">
                        <input 
                            type="text" 
                            placeholder={t('goLive.titlePlaceholder')} 
                            value={streamTitle} 
                            onChange={e => setStreamTitle(e.target.value)} 
                            className="w-full bg-transparent text-lg font-bold text-white placeholder-white/50 focus:outline-none" 
                        />
                        <div className="h-px w-full bg-gradient-to-r from-white/30 to-transparent"></div>
                        <input 
                            type="text" 
                            placeholder={t('goLive.descriptionPlaceholder')} 
                            value={streamDescription} 
                            onChange={e => setStreamDescription(e.target.value)} 
                            className="w-full bg-transparent text-sm text-gray-200 placeholder-gray-400 focus:outline-none" 
                        />
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto">
                         <button 
                            onClick={() => setIsCategoryModalOpen(true)} 
                            className="bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center space-x-1 hover:bg-white/20 transition-colors"
                        >
                            <span># {selectedCategoryLabel}</span>
                            <ChevronRightIcon className="w-3 h-3 opacity-70" />
                        </button>
                        <button onClick={handleSaveChanges} className="text-green-400 text-xs font-bold px-2 py-1 hover:text-green-300 transition-colors">
                            {t('goLive.save')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Settings Panel */}
            <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-lg">
                {/* Stream Type Selector */}
                <div className="p-2 m-2 bg-black/30 rounded-xl flex space-x-1">
                    <StreamTypeButton type="WebRTC" />
                    <StreamTypeButton type="RTMP" />
                    <StreamTypeButton type="SRT" />
                </div>

                <div className="px-4 pb-2">
                    {streamType === 'RTMP' && (
                        <div className="mb-4 p-3 bg-black/30 rounded-xl border border-white/5 space-y-3">
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold ml-1">Servidor RTMP</label>
                                <div className="mt-1 flex items-center bg-black/20 rounded-lg px-3 py-2 border border-white/5">
                                    <input type="text" readOnly value="rtmp://localhost:1935/live" className="w-full bg-transparent text-xs text-gray-300 outline-none" />
                                </div>
                            </div>
                             <div>
                                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold ml-1">Chave</label>
                                <div className="mt-1 flex items-center bg-black/20 rounded-lg px-3 py-2 border border-white/5">
                                    <input type="text" readOnly value="stream_6jsrm5x4" className="w-full bg-transparent text-xs text-gray-300 outline-none" />
                                </div>
                            </div>
                        </div>
                    )}
                    {streamType === 'SRT' && (
                        <div className="mb-4 p-3 bg-black/30 rounded-xl border border-white/5">
                            <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold ml-1">Endereço SRT</label>
                            <div className="mt-1 flex items-center bg-black/20 rounded-lg px-3 py-2 border border-white/5">
                                <input type="text" readOnly value="srt://localhost:1935/live" className="w-full bg-transparent text-xs text-gray-300 outline-none" />
                            </div>
                        </div>
                    )}

                    {/* Controls List */}
                    <div className="space-y-1">
                        <button onClick={() => setIsManualOpen(true)} className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-white/5 transition-colors group">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                    <BookOpenIcon className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-200 group-hover:text-white">{t('goLive.liveManual')}</span>
                            </div>
                            <ChevronRightIcon className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
                        </button>

                        <button onClick={() => setIsBeautyPanelOpen(true)} className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-white/5 transition-colors group">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                                    <SparklesIcon className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-200 group-hover:text-white">{t('goLive.beautyEffects')}</span>
                            </div>
                            <ChevronRightIcon className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
                        </button>

                        <div className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-white/5 transition-colors">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                                    <PKIcon className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-200">{t('goLive.pkBattle')}</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-10 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-white/5 transition-colors">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                    <LockIcon className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-200">Sala Privada</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={isPrivate} onChange={() => setIsPrivate(!isPrivate)} className="sr-only peer" />
                                <div className="w-10 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
      
      <footer className={`p-6 z-20 transition-all duration-500 ${isUiVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <button 
            onClick={handleInitiateStream} 
            className="w-full bg-gradient-to-r from-[#00E5FF] to-[#00FF94] hover:from-[#00d4eb] hover:to-[#00eb88] text-black font-black py-4 rounded-full text-lg shadow-lg shadow-green-500/20 transition-all active:scale-95"
        >
          {t('goLive.startStream')}
        </button>
      </footer>

      {isCategoryModalOpen && <CategoryModal categories={categories} selectedCategoryKey={selectedCategoryKey} onSelectCategory={handleSelectCategory} onClose={() => setIsCategoryModalOpen(false)} />}
      {isBeautyPanelOpen && <BeautyEffectsPanel onClose={() => setIsBeautyPanelOpen(false)} currentUser={currentUser} addToast={addToast} />}
      {isManualOpen && <LiveStreamManualModal onClose={() => setIsManualOpen(false)} />}
    </div>
  );
};

export default GoLiveScreen;
