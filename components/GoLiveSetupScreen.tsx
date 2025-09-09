

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User, Category, CameraStatus, FacingMode, LiveCategory } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import * as authService from '../services/authService';
import CrossIcon from './icons/CrossIcon';
import PlusIcon from './icons/PlusIcon';
import CameraFlipIcon from './icons/CameraFlipIcon';
import BeautyIcon from './icons/BeautyIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import LockClosedIcon from './icons/LockSolidIcon';
import LockOpenIcon from './icons/LockOpenIcon';
import DiamondIcon from './icons/DiamondIcon';
import PkIcon from './icons/PkIcon';
import ToggleSwitch from './ToggleSwitch';
import CameraOffIcon from './icons/CameraOffIcon';

interface GoLiveSetupScreenProps {
  user: User;
  onStartStream: (details: { title: string; meta: string; category: Category, isPrivate: boolean, thumbnailBase64?: string, entryFee?: number, isPkEnabled: boolean, cameraUsed: FacingMode }) => void;
  onExit: () => void;
}

const CategorySelectionModal: React.FC<{
    categories: LiveCategory[];
    onSelect: (category: Category) => void;
    onClose: () => void;
}> = ({ categories, onSelect, onClose }) => {
    return (
        <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#1c1c1e] rounded-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-center text-white mb-6">Selecione uma Categoria</h2>
                <div className="grid grid-cols-3 gap-4">
                    {categories.map(cat => (
                        <button key={cat.id} onClick={() => onSelect(cat.name)} className="p-3 bg-gray-700/50 rounded-lg text-white font-semibold hover:bg-gray-600 transition-colors">
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};


const ToolItem: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void; children?: React.ReactNode }> = ({ icon, label, onClick, children }) => {
  const Component = onClick && !children ? 'button' : 'div';
  const actionProps = Component === 'button' ? { onClick: onClick || (() => alert(`Funcionalidade "${label}" não implementada.`)) } : {};

  return (
    <Component 
      {...actionProps}
      className={`w-full flex items-center justify-between py-3 text-left ${Component === 'button' ? 'transition-colors hover:bg-white/5' : ''}`}
    >
      <div className="flex items-center gap-4">
          {icon}
          <span className="font-semibold text-gray-200">{label}</span>
      </div>
      <div className="flex items-center gap-2">
          {children}
          {Component === 'button' && <span className="text-gray-500 text-lg font-bold">&gt;</span>}
      </div>
    </Component>
  );
};

const GoLiveSetupScreen: React.FC<GoLiveSetupScreenProps> = ({ user, onStartStream, onExit }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('loading');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>('user');
  const [title, setTitle] = useState('');
  const [meta, setMeta] = useState('');
  const [category, setCategory] = useState<Category>('Popular');
  const [thumbnailBase64, setThumbnailBase64] = useState<string | undefined>(undefined);
  const [isStarting, setIsStarting] = useState(false);
  const [isLiveStreamPrivate, setIsLiveStreamPrivate] = useState(false);
  const [isPkEnabled, setIsPkEnabled] = useState(true);
  const [entryFee, setEntryFee] = useState('');
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categories, setCategories] = useState<LiveCategory[]>([]);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [saveDetailsSuccess, setSaveDetailsSuccess] = useState(false);
  const [isBeautyOn, setIsBeautyOn] = useState(false);

  const handleFlipCamera = useCallback(() => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  // Effect for acquiring and cleaning up the camera stream
  useEffect(() => {
    let isMounted = true;
    let stream: MediaStream | null = null;
    
    const requestCamera = async () => {
      console.log('🎥 Iniciando solicitação de câmera...');
      console.log('🔒 Contexto seguro:', window.isSecureContext);
      console.log('🌐 Protocolo:', window.location.protocol);
      console.log('🏠 Hostname:', window.location.hostname);
      
      if (!window.isSecureContext) {
          console.log('❌ Contexto não seguro detectado');
          setCameraStatus('insecure');
          return;
      }
      
      // Verificar se mediaDevices está disponível
      if (!navigator.mediaDevices) {
          console.log('❌ navigator.mediaDevices não disponível');
          setCameraStatus('not-found');
          return;
      }
      
      if (!navigator.mediaDevices.getUserMedia) {
          console.log('❌ getUserMedia não disponível');
          setCameraStatus('not-found');
          return;
      }
        
      setCameraStatus('loading');
      console.log('⏳ Status definido como loading');
      
      try {
        const constraints = {
            audio: true,
            video: {
                facingMode,
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        };
        
        console.log('📋 Constraints:', JSON.stringify(constraints));
        console.log('🎯 Solicitando getUserMedia...');
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        console.log('✅ Stream obtido com sucesso!');
        console.log('🎥 Tracks de vídeo:', stream.getVideoTracks().length);
        console.log('🎤 Tracks de áudio:', stream.getAudioTracks().length);
        
        if (isMounted) {
          setMediaStream(stream);
          setCameraStatus('success');
          console.log('✅ Status definido como success');
        } else {
          // Component unmounted before we could set the stream, so clean up.
          console.log('🧹 Componente desmontado, limpando stream');
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        if (isMounted) {
          console.error("❌ Erro de acesso à câmera:", err);
          console.error("❌ Nome do erro:", err instanceof DOMException ? err.name : 'Não é DOMException');
          console.error("❌ Mensagem:", err instanceof Error ? err.message : 'Sem mensagem');
          
          // Para desenvolvimento/testes, simular câmera quando não encontrada
          if (err instanceof DOMException && 
              (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError')) {
            console.log('🎭 Simulando câmera para ambiente de desenvolvimento...');
            
            // Criar um canvas com vídeo simulado
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              // Desenhar um fundo gradiente
              const gradient = ctx.createLinearGradient(0, 0, 640, 480);
              gradient.addColorStop(0, '#4a5568');
              gradient.addColorStop(1, '#2d3748');
              ctx.fillStyle = gradient;
              ctx.fillRect(0, 0, 640, 480);
              
              // Adicionar texto
              ctx.fillStyle = '#ffffff';
              ctx.font = '24px Arial';
              ctx.textAlign = 'center';
              ctx.fillText('🎥 Câmera Simulada', 320, 220);
              ctx.font = '16px Arial';
              ctx.fillText('Ambiente de Desenvolvimento', 320, 250);
              ctx.fillText('LiveGo - Teste de Transmissão', 320, 280);
            }
            
            // Converter canvas para stream
            const simulatedStream = canvas.captureStream(30);
            
            // Adicionar áudio simulado (silêncio)
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0; // Silêncio
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            const audioDestination = audioContext.createMediaStreamDestination();
            gainNode.connect(audioDestination);
            
            // Combinar vídeo simulado com áudio silencioso
            const combinedStream = new MediaStream([
              ...simulatedStream.getVideoTracks(),
              ...audioDestination.stream.getAudioTracks()
            ]);
            
            setMediaStream(combinedStream);
            setCameraStatus('success');
            console.log('✅ Câmera simulada criada com sucesso!');
            return;
          }
          
          if (err instanceof DOMException) {
            switch (err.name) {
              case 'NotAllowedError':
              case 'PermissionDeniedError':
                console.log('❌ Permissão negada pelo usuário');
                setCameraStatus('denied');
                break;
              case 'NotReadableError':
              case 'OverconstrainedError': // Can happen if ideal resolution isn't available
                console.log('❌ Câmera em uso ou constraints não suportadas');
                setCameraStatus('in-use');
                break;
              case 'NotFoundError':
              case 'DevicesNotFoundError':
                console.log('❌ Nenhuma câmera encontrada');
                setCameraStatus('not-found');
                break;
              case 'TimeoutError':
                console.log('❌ Timeout na solicitação da câmera');
                setCameraStatus('timeout');
                break;
              default:
                console.log('❌ Erro desconhecido:', err.name);
                setCameraStatus('error');
            }
          } else {
            console.log('❌ Erro não-DOM');
            setCameraStatus('error');
          }
        }
      }
    };

    requestCamera();
    
    return () => {
      isMounted = false;
      const currentStream = stream || mediaStream;
      currentStream?.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    };
  }, [facingMode]); // Re-run when facing mode changes

  // Effect for attaching the stream to the video element and playing it safely
  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && mediaStream) {
      if (videoElement.srcObject !== mediaStream) {
          videoElement.srcObject = mediaStream;
      }
      
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Ignore AbortError which is expected on unmount
          if (error.name !== 'AbortError') {
            console.error("Video play failed:", error);
          }
        });
      }
    }
  }, [mediaStream]);


  useEffect(() => {
    const fetchSettings = async () => {
        setIsSettingsLoading(true);
        try {
            const [preferences, fetchedCategories] = await Promise.all([
                liveStreamService.getUserLivePreferences(user.id),
                liveStreamService.getLiveCategories()
            ]);
            
            setIsPkEnabled(preferences.isPkEnabled);
            setFacingMode(preferences.lastCameraUsed || 'user');
            setCategory(preferences.lastSelectedCategory || 'Popular');
            setTitle(preferences.lastLiveTitle || '');
            setMeta(preferences.lastLiveMeta || '');
            
            setCategories(fetchedCategories);

        } catch (error) {
            console.error("Failed to fetch settings:", error);
            // Set defaults on error
            setIsPkEnabled(true);
        } finally {
            setIsSettingsLoading(false);
        }
    };

    fetchSettings();
  }, [user.id]);
  
  const handleThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePkToggleChange = async (enabled: boolean) => {
      const originalState = isPkEnabled;
      setIsPkEnabled(enabled); // Optimistic update
      try {
          await liveStreamService.updateUserPkPreference(user.id, enabled);
      } catch (error) {
          console.error("Failed to update PK preference:", error);
          setIsPkEnabled(originalState); // Revert on failure
          alert("Não foi possível salvar sua preferência de PK. Tente novamente.");
      }
  };

  const handleSaveDetails = async () => {
    if (isSavingDetails) return;
    setIsSavingDetails(true);
    try {
        await authService.updateUserProfile(user.id, {
            lastLiveTitle: title,
            lastLiveMeta: meta,
        });
        setSaveDetailsSuccess(true);
        setTimeout(() => setSaveDetailsSuccess(false), 2000);
    } catch (err) {
        alert("Falha ao salvar os detalhes.");
    } finally {
        setIsSavingDetails(false);
    }
  };

  const handleStartClick = useCallback(async () => {
    const parsedFee = parseInt(entryFee, 10);
    const feeToSend = !isNaN(parsedFee) && parsedFee > 0 ? parsedFee : undefined;

    if (!title.trim()) {
        alert("Por favor, insira um título para a sua live.");
        return;
    }
    setIsStarting(true);
     // The startLiveStream API will now save these preferences.
     // No need to call updateUserProfile here anymore.

    onStartStream({ 
        title,
        meta,
        category, 
        isPrivate: isLiveStreamPrivate, 
        thumbnailBase64, 
        entryFee: isLiveStreamPrivate ? feeToSend : undefined,
        isPkEnabled: isPkEnabled,
        cameraUsed: facingMode,
    });
  }, [title, meta, category, isLiveStreamPrivate, thumbnailBase64, entryFee, isPkEnabled, onStartStream, facingMode]);

  const renderFeeInput = () => (
    <div className="flex items-center gap-3 mt-4 bg-gray-800/80 backdrop-blur-sm p-3 rounded-lg">
        <DiamondIcon className="w-5 h-5 text-yellow-400 shrink-0"/>
        <label htmlFor="entry-fee" className="text-sm font-semibold text-gray-300 shrink-0">Taxa de Entrada</label>
        <input
            id="entry-fee"
            type="number"
            value={entryFee}
            onChange={(e) => setEntryFee(e.target.value)}
            placeholder="Opcional"
            className="w-full bg-transparent text-white placeholder-gray-500 text-right focus:outline-none"
            min="0"
        />
    </div>
  );

  return (
    <div className="relative h-screen w-full bg-black text-white flex flex-col font-sans">
      {isCategoryModalOpen && (
          <CategorySelectionModal 
              categories={categories}
              onClose={() => setIsCategoryModalOpen(false)}
              onSelect={(cat) => {
                  setCategory(cat);
                  setIsCategoryModalOpen(false);
              }}
          />
      )}
      <div className="absolute inset-0 z-0">
        {cameraStatus === 'success' ? (
          <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`} />
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center p-4">
            {cameraStatus === 'loading' && (
                <div className="w-12 h-12 border-4 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
            )}
            {cameraStatus === 'insecure' && (
                 <div className="text-center">
                    <CameraOffIcon className="w-16 h-16 mb-4 text-red-500 mx-auto" />
                    <h2 className="text-xl font-bold text-red-400">Conexão insegura</h2>
                    <p className="text-gray-400 mt-2 max-w-xs">
                        O acesso à câmera requer uma conexão segura (HTTPS) ou localhost.
                    </p>
                </div>
            )}
          </div>
        )}
      </div>

      <div className="absolute inset-0 bg-black/40 z-10"></div>
      
      <div className="absolute top-1/3 right-4 z-20 flex flex-col gap-4">
        <button
            onClick={handleFlipCamera}
            className="bg-black/40 backdrop-blur-sm p-3 rounded-full hover:bg-black/60 transition-colors"
            aria-label="Alternar câmera"
        >
            <CameraFlipIcon className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="relative z-20 flex flex-col h-full p-4 overflow-y-auto scrollbar-hide">
        <header className="flex justify-end items-center mb-6 shrink-0">
          <button onClick={onExit} className="p-2 -m-2 bg-black/40 rounded-full">
            <CrossIcon className="w-7 h-7" />
          </button>
        </header>

        <main className="flex-grow flex flex-col justify-start">
            <div className="flex items-start gap-4 mb-4">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 bg-gray-800/70 rounded-lg flex flex-col items-center justify-center text-xs shrink-0 border border-gray-600 overflow-hidden"
                >
                    {thumbnailBase64 ? (
                        <img src={thumbnailBase64} alt="Thumbnail preview" className="w-full h-full object-cover" />
                    ) : (
                        <>
                            <PlusIcon className="w-6 h-6 mb-1" />
                            Adicionar Capa
                        </>
                    )}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleThumbnailUpload} />
                <div className="w-full pt-2">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Dê um título para sua transmi..."
                        className="w-full bg-transparent text-xl font-semibold text-white placeholder-gray-400 focus:outline-none border-b border-gray-600 focus:border-green-500 pb-2 transition-colors"
                    />
                     <div className="flex items-center gap-2 mt-2">
                        <input
                            type="text"
                            value={meta}
                            onChange={(e) => setMeta(e.target.value)}
                            placeholder="Descrição (opcional)..."
                            maxLength={100}
                            className="flex-grow bg-transparent text-sm text-gray-300 placeholder-gray-500 focus:outline-none"
                        />
                        <button
                            onClick={handleSaveDetails}
                            disabled={isSavingDetails || saveDetailsSuccess}
                            className="shrink-0 bg-gray-700 text-white font-semibold px-3 py-1.5 rounded-full text-xs transition-colors hover:bg-gray-600 disabled:opacity-50"
                        >
                            {isSavingDetails ? '...' : saveDetailsSuccess ? 'Salvo!' : 'Salvar'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
                <button
                    onClick={() => setIsLiveStreamPrivate(p => !p)}
                    className="bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm flex items-center gap-2 transition-colors text-gray-300"
                >
                    {isLiveStreamPrivate 
                        ? <LockClosedIcon className="w-4 h-4" /> 
                        : <LockOpenIcon className="w-4 h-4" />
                    }
                    {isLiveStreamPrivate ? 'Live Privada' : 'Sala Pública'}
                </button>
                
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm text-gray-300"
                >
                    {category}
                </button>
            </div>

            {isLiveStreamPrivate && renderFeeInput()}

            <div className="bg-black/40 backdrop-blur-sm rounded-xl divide-y divide-white/10 mt-4 px-4">
                <ToolItem icon={<BookOpenIcon className="w-6 h-6 text-gray-300" />} label="Manual de Transmissão ao Vivo" />
                <ToolItem icon={<BeautyIcon className="w-6 h-6 text-gray-300" />} label="Efeitos de Beleza">
                    <ToggleSwitch enabled={isBeautyOn} onChange={setIsBeautyOn} />
                </ToolItem>
                <ToolItem icon={<PkIcon className="w-7 h-7" />} label="Batalha PK">
                    <ToggleSwitch enabled={isPkEnabled} onChange={handlePkToggleChange} />
                </ToolItem>
            </div>
        </main>

        <footer className="shrink-0 flex flex-col items-center pb-4 pt-4 mt-auto">
            {cameraStatus === 'denied' && (
                <p className="text-red-400 text-center text-sm mb-4">Acesso à câmera negado. Verifique as permissões do navegador.</p>
            )}
            {cameraStatus === 'timeout' && (
                <p className="text-yellow-400 text-center text-sm mb-4">A câmera demorou para responder. Verifique suas conexões e tente novamente.</p>
            )}
            {cameraStatus === 'in-use' && (
                <p className="text-yellow-400 text-center text-sm mb-4">Sua câmera parece estar em uso por outro aplicativo. Por favor, feche-o e tente novamente.</p>
            )}
            {cameraStatus === 'not-found' && (
                <p className="text-red-400 text-center text-sm mb-4">Nenhuma câmera foi encontrada. Verifique se ela está conectada.</p>
            )}
            {cameraStatus === 'error' && (
                 <p className="text-red-400 text-center text-sm mb-4">Ocorreu um erro com a câmera. Tente novamente.</p>
            )}
            
            {!title.trim() && cameraStatus === 'success' && !isStarting && !isSettingsLoading && (
                <p className="text-yellow-400 text-center text-sm mb-4">
                    Por favor, insira um título para iniciar.
                </p>
            )}
            
            <button
                onClick={handleStartClick}
                disabled={isStarting || cameraStatus !== 'success' || !title.trim() || isSettingsLoading}
                className="w-full max-w-sm bg-[#34C759] text-black font-bold py-4 rounded-full text-lg transition-opacity hover:opacity-90 disabled:opacity-50"
            >
                {isStarting || isSettingsLoading ? 'Carregando...' : 'Iniciar Transmissão'}
            </button>
        </footer>
      </div>
       <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default GoLiveSetupScreen;