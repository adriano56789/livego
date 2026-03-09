import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon, ExpandIcon, BookOpenIcon, SparklesIcon, PKIcon, ChevronRightIcon, LockIcon, CopyIcon, CheckIcon } from './icons';
import { Streamer, ToastType, User, BeautySettings } from '../types';
import BeautyEffectsPanel from './live/BeautyEffectsPanel';
import LiveStreamManualModal from './live/LiveStreamManualModal';
import { useTranslation } from '../i18n';
import { api } from '../services/api';
import { webRTCService } from '../services/webrtcService.js';

export interface InviteData {
    streamId: string;
    hostId: string;
    streamName: string;
    hostName: string;
    hostAvatar: string;
}

interface GoLiveScreenProps {
    isOpen: boolean;
    onClose: () => void;
    onStartStream: (streamer: Streamer) => void;
    onJoinStream?: (streamer: Streamer) => void;
    addToast: (type: ToastType, message: string) => void;
    currentUser: User;
    inviteData?: InviteData | null;
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

const CATEGORIES = [
    { key: 'popular', label: 'Popular' },
    { key: 'followed', label: 'Seguido' },
    { key: 'nearby', label: 'Perto' },
    { key: 'pk', label: 'PK' },
    { key: 'new', label: 'Novo' },
    { key: 'music', label: 'Música' },
    { key: 'dance', label: 'Dança' },
    { key: 'party', label: 'Festa' },
    { key: 'private', label: 'Privado' }
];

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


const GoLiveScreen: React.FC<GoLiveScreenProps> = ({ isOpen, onClose, onStartStream, onJoinStream, addToast, currentUser, inviteData }) => {
    const { t } = useTranslation();
    const [isUiVisible, setIsUiVisible] = useState(true);
    const [streamType, setStreamType] = useState('WebRTC');
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    const [selectedRegion, setSelectedRegion] = useState(currentUser.country || 'global');
    const categories: Category[] = CATEGORIES;

    const [selectedCategoryKey, setSelectedCategoryKey] = useState(categories[0]?.key || 'popular');
    const [isBeautyPanelOpen, setIsBeautyPanelOpen] = useState(false);
    const [isManualOpen, setIsManualOpen] = useState(false);
    const [streamTitle, setStreamTitle] = useState('');
    const [streamDescription, setStreamDescription] = useState('');
    const [draftStream, setDraftStream] = useState<Streamer | null>(null);
    const [isPrivate, setIsPrivate] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const isStartingStream = useRef(false);

    const isInviteMode = !!inviteData;

    useEffect(() => {
        const setupStream = async () => {
            if (isOpen) {
                isStartingStream.current = false; // Reset flag on open

                if (!isInviteMode) {
                    // Create a draft stream as soon as the screen opens (Only for broadcasters)
                    try {
                        const streamName = streamTitle || `Live de ${currentUser.name}`;
                        const newDraft = await api.createStream({
                            name: streamName,
                            hostId: currentUser.id
                        });
                        if (!newDraft) {
                            throw new Error("API failed to return a stream draft.");
                        }
                        
                        // ACESSAR O STREAM DA RESPOSTA CORRETAMENTE
                        const streamData = (newDraft as any).success ? (newDraft as any).stream : newDraft;
                        console.log(' [DEBUG] streamData:', streamData);
                        console.log(' [DEBUG] streamData.id:', streamData.id);
                        
                        setDraftStream(streamData);
                        setStreamTitle(streamData.name);
                        setStreamDescription(streamData.message);
                    } catch (error) {
                        console.error("Error setting up stream:", error);
                        addToast(ToastType.Error, "Falha ao criar rascunho da live.");
                        onClose();
                    }
                } else {
                    // Invite Mode: Pre-fill title and description with invite info
                    setStreamTitle(inviteData?.streamName || "Sala Privada");
                    setStreamDescription(`Convite de ${inviteData?.hostName}`);
                }

                // Setup camera preview
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    navigator.mediaDevices.getUserMedia({ video: true })
                        .then(stream => {
                            if (videoRef.current) {
                                videoRef.current.srcObject = stream;
                            }
                        })
                        .catch(err => {
                            console.error('Erro ao acessar câmera:', err);
                            // Não bloquear o uso se a câmera não estiver disponível
                        });
                } else {
                    console.warn('navigator.mediaDevices não disponível neste navegador');
                }
            } else {
                // Cleanup when component closes
                if (videoRef.current && videoRef.current.srcObject) {
                    const stream = videoRef.current.srcObject as MediaStream;
                    stream.getTracks().forEach(track => track.stop());
                    videoRef.current.srcObject = null;
                }

                if (!isStartingStream.current) {
                    webRTCService.stop();
                }

                setDraftStream(null);
                setStreamTitle('');
                setStreamDescription('');
            }
        };
        setupStream();
    }, [isOpen, isInviteMode, inviteData]);

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
            if (success && stream) {
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
        if (isInviteMode || !draftStream) return; // Disable upload for invite mode
        try {
            // ENVIAR UMA URL DE CAPA VÁLIDA (placeholder)
            const coverUrl = `https://picsum.photos/seed/cover-${draftStream.id}/400/600.jpg`;
            const { success, stream } = await api.uploadStreamCover(draftStream.id, { coverUrl });
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

    const startWebRTCPublish = async (streamId: string): Promise<MediaStream | null> => {
        try {
            if (videoRef.current && videoRef.current.srcObject) {
                const prevStream = videoRef.current.srcObject as MediaStream;
                prevStream.getTracks().forEach(t => t.stop());
            }

            const streamUrl = `webrtc://72.60.249.175/live/${streamId}`;
            
            // ✅ Obter streamKey real do draft
            const streamKey = draftStream?.streamKey || streamId;
            
            console.log(`[GoLive] Publicando com streamKey real: ${streamKey}`);
            console.log(`[GoLiveScreen] Iniciando transmissão WebRTC para: ${streamUrl}`);
            
            const mediaStream = await webRTCService.startPublish(streamUrl, streamKey);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

            addToast(ToastType.Success, "Conexão WebRTC estabelecida via TURN!");
            isStartingStream.current = true;
            return mediaStream;
        } catch (rtcError) {
            console.error("WebRTC Publish Error:", rtcError);
            addToast(ToastType.Error, "Erro ao iniciar transmissão WebRTC. Verifique sua conexão.");
            return null;
        }
    }

    const handleInitiateStream = async () => {
        // === INVITE MODE LOGIC ===
        if (isInviteMode && inviteData && onJoinStream) {
            // Just start publishing to the existing stream ID
            const stream = await startWebRTCPublish(inviteData.streamId);
            if (stream) {
                const targetStream: Streamer = {
                    id: inviteData.streamId,
                    hostId: inviteData.hostId, // Using real hostId from invite
                    name: inviteData.streamName,
                    avatar: inviteData.hostAvatar || '',
                    location: 'Privada',
                    time: 'Ao Vivo',
                    message: 'Sala Privada',
                    tags: ['private'],
                    isPrivate: true
                };
                onJoinStream(targetStream);
            }
            return;
        }

        // === BROADCASTER LOGIC ===
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
                if (streamType === 'WebRTC') {
                    await startWebRTCPublish(stream.id);
                }
                onStartStream(stream);
            } else {
                throw new Error("Failed to save stream before starting.");
            }
        } catch (error) {
            addToast(ToastType.Error, "Falha ao iniciar a transmissão.");
        }
    };

    const copyToClipboard = (text?: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            addToast(ToastType.Success, "Copiado!");
        }).catch(() => {
            addToast(ToastType.Error, "Falha ao copiar.");
        });
    };

    const StreamTypeButton: React.FC<{ type: string }> = ({ type }) => (
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
            className={`absolute inset-0 bg-black z-50 transition-opacity duration-300 flex flex-col justify-between ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
        >
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover -z-10 transform scale-x-[-1]"></video>
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
                    {/* Modal Title Header */}
                    {/* Removido título "Iniciando transmissão" */}

                    {/* Unified Input Section - Reusing layout for both modes */}
                    <div className="flex items-start space-x-3">
                        <button
                            onClick={handleAddCover}
                            disabled={isInviteMode}
                            className="w-16 h-16 bg-gray-800/80 rounded-lg flex flex-col items-center justify-center text-gray-300 text-xs flex-shrink-0 overflow-hidden relative"
                        >
                            {isInviteMode && inviteData ? (
                                <img src={inviteData.hostAvatar} alt="Host Avatar" className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                                draftStream?.avatar && <img src={draftStream.avatar} alt="Capa da Live" className="absolute inset-0 w-full h-full object-cover" />
                            )}

                            {!isInviteMode && (
                                <>
                                    <span className="relative text-2xl font-light">+</span>
                                    <span className="relative">{t('goLive.addCover')}</span>
                                </>
                            )}
                        </button>
                        <div className="flex-grow space-y-2">
                            <input
                                type="text"
                                placeholder={t('goLive.titlePlaceholder')}
                                value={streamTitle}
                                onChange={e => !isInviteMode && setStreamTitle(e.target.value)}
                                readOnly={isInviteMode}
                                className="w-full bg-transparent border-b border-gray-600 p-1 text-white focus:outline-none focus:border-white font-bold text-lg"
                            />
                            <input
                                type="text"
                                placeholder={t('goLive.descriptionPlaceholder')}
                                value={streamDescription}
                                onChange={e => !isInviteMode && setStreamDescription(e.target.value)}
                                readOnly={isInviteMode}
                                className="w-full bg-transparent border-b border-gray-600 p-1 text-white focus:outline-none focus:border-white text-sm"
                            />
                        </div>
                        {!isInviteMode && (
                            <button onClick={handleSaveChanges} className="bg-gray-700/80 text-white px-5 py-2 rounded-full text-sm self-end">{t('goLive.save')}</button>
                        )}
                    </div>

                    {/* Categories - Hidden in Invite Mode */}
                    {!isInviteMode && (
                        <div className="flex items-center space-x-2">
                            <button onClick={() => setIsCategoryModalOpen(true)} className="bg-gray-700/80 text-gray-300 text-sm px-3 py-1 rounded-full">{selectedCategoryLabel}</button>
                            {/* Region Selector Snippet */}
                            <select
                                value={selectedRegion}
                                onChange={e => {
                                    setSelectedRegion(e.target.value);
                                    setSelectedCategoryKey(CATEGORIES[0]?.key || 'popular');
                                }}
                                className="bg-gray-700/80 text-gray-300 text-sm px-3 py-1 rounded-full border-none focus:outline-none"
                            >
                                <option value="br">🇧🇷 Brasil</option>
                                <option value="us">🇺🇸 USA</option>
                                <option value="global">🌍 Global</option>
                            </select>
                        </div>
                    )}

                    <div className="bg-gray-800/80 p-4 rounded-2xl space-y-4 text-white max-h-[40vh] overflow-y-auto no-scrollbar">
                        {!isInviteMode && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">{t('goLive.streamType')}</span>
                                <div className="flex items-center space-x-2">
                                    <StreamTypeButton type="WebRTC" />
                                    <StreamTypeButton type="RTMP" />
                                    <StreamTypeButton type="SRT" />
                                </div>
                            </div>
                        )}

                        {/* RTMP/SRT Info (Only if Broadcaster and selected) */}
                        {!isInviteMode && streamType === 'RTMP' && (
                            <div className="text-xs space-y-3 text-gray-300 bg-black/20 p-3 rounded-lg border border-white/5">
                                <div className="space-y-1">
                                    <label className="font-semibold text-gray-400">Servidor RTMP (Ingest)</label>
                                    <div className="flex items-center space-x-2">
                                        <input type="text" readOnly value={draftStream?.rtmpIngestUrl || 'Gerando...'} className="flex-1 bg-[#111] border border-white/10 p-2 rounded-md text-white select-all font-mono" />
                                        <button onClick={() => copyToClipboard(draftStream?.rtmpIngestUrl)} className="bg-[#333] hover:bg-[#444] text-white p-2 rounded-md">
                                            <CopyIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="font-semibold text-gray-400">Chave de Transmissão (Stream Key)</label>
                                    <div className="flex items-center space-x-2">
                                        <input type="text" readOnly value={draftStream?.streamKey || 'Gerando...'} className="flex-1 bg-[#111] border border-white/10 p-2 rounded-md text-white select-all font-mono" />
                                        <button onClick={() => copyToClipboard(draftStream?.streamKey)} className="bg-[#333] hover:bg-[#444] text-white p-2 rounded-md">
                                            <CopyIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500 pt-1 border-t border-white/5 mt-2">Copie e cole esses dados no seu software de transmissão (OBS Studio, vMix, etc).</p>
                            </div>
                        )}

                        {!isInviteMode && streamType === 'SRT' && (
                            <div className="text-xs space-y-3 text-gray-300 bg-black/20 p-3 rounded-lg border border-white/5">
                                <div className="space-y-1">
                                    <label className="font-semibold text-gray-400">URL SRT (Ingest)</label>
                                    <div className="flex items-center space-x-2">
                                        <input type="text" readOnly value={draftStream?.srtIngestUrl || 'Gerando...'} className="flex-1 bg-[#111] border border-white/10 p-2 rounded-md text-white select-all font-mono" />
                                        <button onClick={() => copyToClipboard(draftStream?.srtIngestUrl)} className="bg-[#333] hover:bg-[#444] text-white p-2 rounded-md">
                                            <CopyIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500 pt-1 border-t border-white/5 mt-2">Configure o RootEncoder ou outro software compatível para transmitir para o endereço SRT acima.</p>
                            </div>
                        )}

                        {!isInviteMode && (streamType === 'RTMP' || streamType === 'SRT') && (
                            <div className="text-xs space-y-1 text-gray-300 bg-black/20 p-3 rounded-lg border border-white/5">
                                <label className="font-semibold text-gray-400">URL de Playback (HLS)</label>
                                <div className="flex items-center space-x-2">
                                    <input type="text" readOnly value={draftStream?.playbackUrl || 'Gerando...'} className="flex-1 bg-[#111] border border-white/10 p-2 rounded-md text-white select-all font-mono text-[10px]" />
                                    <button onClick={() => copyToClipboard(draftStream?.playbackUrl)} className="bg-[#333] hover:bg-[#444] text-white p-2 rounded-md">
                                        <CopyIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Common Tools */}
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

                        {!isInviteMode && (
                            <>
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
                            </>
                        )}
                    </div>
                </div>
            </div>

            <footer className="p-4 z-20">
                <button
                    onClick={handleInitiateStream}
                    className={`w-full font-bold py-4 rounded-full transition-colors ${isInviteMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-500 hover:bg-green-600'} text-white`}
                >
                    {isInviteMode ? "Entrar na Sala" : t('goLive.startStream')}
                </button>
            </footer>

            {isCategoryModalOpen && <CategoryModal categories={categories} selectedCategoryKey={selectedCategoryKey} onSelectCategory={handleSelectCategory} onClose={() => setIsCategoryModalOpen(false)} />}
            {isBeautyPanelOpen && <BeautyEffectsPanel onClose={() => setIsBeautyPanelOpen(false)} currentUser={currentUser} addToast={addToast} />}
            {isManualOpen && <LiveStreamManualModal onClose={() => setIsManualOpen(false)} />}
        </div>
    );
};

export default GoLiveScreen;