
import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon, ExpandIcon, BookOpenIcon, SparklesIcon, PKIcon, ChevronRightIcon, LockIcon } from './icons';
import { Streamer, ToastType, User, BeautySettings } from '../types';
import BeautyEffectsPanel from './live/BeautyEffectsPanel';
import LiveStreamManualModal from './live/LiveStreamManualModal';
import { useTranslation } from '../i18n';
import { api } from '../services/api';

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
        <div className="absolute inset-x-0 bottom-0 bg-[#222225] rounded-t-2xl z-50 p-4" onClick={e => e.stopPropagation()}>
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Selecionar Categoria</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            <ul className="space-y-2">
                {categories.map((cat) => (
                    <li 
                        key={cat.key}
                        onClick={() => onSelectCategory(cat.key)}
                        className={`p-3 rounded-lg text-left w-full cursor-pointer transition-colors ${selectedCategoryKey === cat.key ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-800/50'}`}>
                        {cat.label}
                    </li>
                ))}
            </ul>
        </div>
    );
};


const GoLiveScreen: React.FC<GoLiveScreenProps> = ({ isOpen, onClose, onStartStream, addToast, currentUser }) => {
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

            // Setup camera
            navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch(err => console.error("Error accessing camera:", err));
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
        className={`px-4 py-1 rounded-full text-sm transition-colors ${streamType === type ? 'bg-blue-500 text-white' : 'bg-gray-600/50 text-gray-300 hover:bg-gray-500/50'}`}
    >
        {type}
    </button>
  );
  
  const selectedCategoryLabel = categories.find(c => c.key === selectedCategoryKey)?.label || selectedCategoryKey;

  return (
    <div
      className={`absolute inset-0 bg-black z-50 transition-opacity duration-300 flex flex-col justify-between ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover -z-10"></video>
      <div className="absolute inset-0" onClick={showUi}></div>

      <header className={`absolute top-0 right-0 p-4 flex items-center space-x-2 z-20`}>
        <button onClick={hideUi} className={`w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white transition-opacity duration-300 ${isUiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <ExpandIcon className="w-5 h-5" />
        </button>
        <button onClick={onClose} className="w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white">
          <CloseIcon className="w-5 h-5" />
        </button>
      </header>
      
      <div 
        className={`z-10 transition-opacity duration-300 ${isUiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 space-y-4">
            <div className="flex items-start space-x-3">
                <button onClick={handleAddCover} className="w-16 h-16 bg-gray-800/80 rounded-lg flex flex-col items-center justify-center text-gray-300 text-xs flex-shrink-0 overflow-hidden relative">
                    {draftStream?.avatar && <img src={draftStream.avatar} alt="Capa da Live" className="absolute inset-0 w-full h-full object-cover" />}
                    <span className="relative text-2xl font-light">+</span>
                    <span className="relative">{t('goLive.addCover')}</span>
                </button>
                <div className="flex-grow space-y-2">
                    <input type="text" placeholder={t('goLive.titlePlaceholder')} value={streamTitle} onChange={e => setStreamTitle(e.target.value)} className="w-full bg-transparent border-b border-gray-600 p-1 text-white focus:outline-none focus:border-white" />
                    <input type="text" placeholder={t('goLive.descriptionPlaceholder')} value={streamDescription} onChange={e => setStreamDescription(e.target.value)} className="w-full bg-transparent border-b border-gray-600 p-1 text-white focus:outline-none focus:border-white" />
                </div>
                 <button onClick={handleSaveChanges} className="bg-gray-700/80 text-white px-5 py-2 rounded-full text-sm self-end">{t('goLive.save')}</button>
            </div>

            <div className="flex items-center space-x-2">
                <button onClick={() => setIsCategoryModalOpen(true)} className="bg-gray-700/80 text-gray-300 text-sm px-3 py-1 rounded-full">{selectedCategoryLabel}</button>
            </div>

            <div className="bg-gray-800/80 p-4 rounded-2xl space-y-4 text-white">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">{t('goLive.streamType')}</span>
                    <div className="flex items-center space-x-2">
                       <StreamTypeButton type="WebRTC" />
                       <StreamTypeButton type="RTMP" />
                       <StreamTypeButton type="SRT" />
                    </div>
                </div>

                {streamType === 'RTMP' && (
                    <div className="text-xs space-y-2 text-gray-300">
                        <div>
                            <label className="font-semibold">Servidor RTMP</label>
                            <input type="text" readOnly value="rtmp://localhost:1935/live" className="w-full bg-gray-700/50 p-2 rounded-md mt-1" />
                        </div>
                         <div>
                            <label className="font-semibold">Chave de Transmissão</label>
                            <input type="text" readOnly value="stream_6jsrm5x4" className="w-full bg-gray-700/50 p-2 rounded-md mt-1" />
                        </div>
                        <p>Copie esses dados para o RootEncoder</p>
                    </div>
                )}
                 {streamType === 'SRT' && (
                    <div className="text-xs space-y-2 text-gray-300">
                        <div>
                            <label className="font-semibold">Endereço SRT</label>
                            <input type="text" readOnly value="rtmp://localhost:1935/live" className="w-full bg-gray-700/50 p-2 rounded-md mt-1" />
                        </div>
                        <p>Configure o RootEncoder para transmitir para o endereço SRT acima</p>
                    </div>
                )}


                <button onClick={() => setIsManualOpen(true)} className="flex items-center justify-between py-2 border-t border-b border-gray-700/50 w-full">
                    <div className="flex items-center space-x-3">
                        <BookOpenIcon className="w-5 h-5 text-gray-400" />
                        <span>{t('goLive.liveManual')}</span>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                </button>
                <button onClick={() => setIsBeautyPanelOpen(true)} className="flex items-center justify-between py-2 w-full">
                    <div className="flex items-center space-x-3">
                        <SparklesIcon className="w-5 h-5 text-gray-400" />
                        <span>{t('goLive.beautyEffects')}</span>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                </button>
                 <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
                    <div className="flex items-center space-x-3">
                        <PKIcon className="w-5 h-5" />
                        <span>{t('goLive.pkBattle')}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
                    <div className="flex items-center space-x-3">
                        <LockIcon className="w-5 h-5 text-gray-400" />
                        <span>Sala Privada</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={isPrivate} onChange={() => setIsPrivate(!isPrivate)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                </div>
            </div>
        </div>
      </div>
      
      <footer className="p-4 z-20">
        <button onClick={handleInitiateStream} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-full transition-colors">
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
