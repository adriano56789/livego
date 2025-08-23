
import React, { useRef, useEffect } from 'react';
import CrossIcon from './icons/CrossIcon';

// Anchor Tool Icons
import BeautifyStarIcon from './icons/BeautifyStarIcon';
import SoundEffectIcon from './icons/SoundEffectIcon';
import VoiceIcon from './icons/VoiceIcon';
import ClarityIcon from './icons/ClarityIcon';
import MailIcon from './icons/MailIcon';
import BoxingGlovesIcon from './icons/BoxingGlovesIcon';
import GroupWhiteIcon from './icons/GroupWhiteIcon';
import LinkedCirclesIcon from './icons/LinkedCirclesIcon';


// Basic Tool Icons
import CameraFlipIcon from './icons/CameraFlipIcon';
import MuteIcon from './icons/MuteIcon';
import RoomEffectsIcon from './icons/RoomEffectsIcon';
import MessageIcon from './icons/MessageIcon';
import MirrorImageIcon from './icons/MirrorImageIcon';
import RotateIcon from './icons/RotateIcon';
import { FacingMode } from '../types';


interface ArcoraToolModalProps {
  onClose: () => void;
  onOpenMuteModal: () => void;
  onOpenSoundEffectModal: () => void;
  onSwitchCamera: () => void;
  cameraFacingMode: FacingMode;
  onToggleVoice: () => void;
  isVoiceEnabled: boolean;
  onOpenPrivateChat: () => void;
  isPrivateStream: boolean;
  onOpenPrivateInviteModal: () => void;
  onOpenPkStartModal: () => void;
  isPkBattleActive: boolean;
  onOpenPkInviteModal: () => void;
  mediaStream: MediaStream | null;
}

const ToolButton: React.FC<{ icon: React.ReactNode; label: string; subLabel?: string; isNew?: boolean; notImplemented?: boolean; onClick?: () => void; isActive?: boolean; }> = ({ icon, label, subLabel, isNew, notImplemented, onClick, isActive }) => (
    <button 
        className="flex flex-col items-center justify-start gap-2 text-center relative h-24" 
        onClick={onClick || (() => alert(notImplemented ? `Funcionalidade "${label}" não implementada.` : `${label} clicado!`))}
    >
        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${isActive ? 'bg-green-500' : 'bg-[#3d3d3d]/80'}`}>
        {icon}
        </div>
        <span className="text-xs text-gray-300 w-full truncate">{label}</span>
        {subLabel && <span className="text-[10px] text-green-400 font-semibold -mt-1">{subLabel}</span>}
        {isNew && (
        <span className="absolute top-[-2px] right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 rounded-full shadow-md">new</span>
        )}
        {notImplemented && (
            <div className="absolute top-0 right-2">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                </span>
            </div>
        )}
    </button>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-300 mb-4">{title}</h3>
        <div className="grid grid-cols-4 gap-x-2 gap-y-4">
            {children}
        </div>
    </div>
);


const ArcoraToolModal: React.FC<ArcoraToolModalProps> = ({ 
    onClose, 
    onOpenMuteModal, 
    onOpenSoundEffectModal, 
    onSwitchCamera, 
    cameraFacingMode,
    onToggleVoice, 
    isVoiceEnabled, 
    onOpenPrivateChat, 
    isPrivateStream,
    onOpenPrivateInviteModal,
    onOpenPkStartModal,
    isPkBattleActive,
    onOpenPkInviteModal,
    mediaStream,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (videoElement && mediaStream) {
            if (videoElement.srcObject !== mediaStream) {
                videoElement.srcObject = mediaStream;
            }
            const playPromise = videoElement.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    if (error.name !== 'AbortError') {
                        console.error("Modal video play failed", error);
                    }
                });
            }
        }
    }, [mediaStream]);

    const iconClass = "w-7 h-7 text-gray-200";

    const anchorTools = [
        { icon: <BeautifyStarIcon className={iconClass} />, label: 'Embelezar', notImplemented: true },
        { icon: <SoundEffectIcon className={iconClass} />, label: 'Efeito sonoro', onClick: onOpenSoundEffectModal },
        { icon: <VoiceIcon className={iconClass} />, label: 'Âncora de Voz', onClick: onToggleVoice, isActive: isVoiceEnabled },
        { icon: <ClarityIcon className={iconClass} />, label: 'Clareza', notImplemented: true },
    ];
    
    if (isPrivateStream) {
        anchorTools.push({ icon: <MailIcon className={iconClass} />, label: 'Convite Privado', onClick: onOpenPrivateInviteModal });
    }

    const pkTools = [
        { icon: <LinkedCirclesIcon className="w-10 h-10" />, label: '+ Hosts', onClick: onOpenPkInviteModal },
        { icon: <BoxingGlovesIcon className="w-10 h-10" />, label: 'Batalha', onClick: onOpenPkStartModal },
        { icon: <GroupWhiteIcon className="w-10 h-10" />, label: '+Conv', notImplemented: true, onClick: () => alert("Funcionalidade +Conv não implementada.") }
    ];

    const basicTools = [
        { icon: <CameraFlipIcon className={iconClass} />, label: 'Giro', onClick: onSwitchCamera, subLabel: cameraFacingMode === 'user' ? 'Frontal' : 'Traseira' },
        { icon: <MuteIcon className={iconClass} />, label: 'Silenciamento', onClick: onOpenMuteModal },
        { icon: <MessageIcon className={iconClass} />, label: 'Bate-papo', onClick: onOpenPrivateChat },
        { icon: <MirrorImageIcon className={iconClass} />, label: 'Imagem espelhada', notImplemented: true },
        { icon: <RotateIcon className={iconClass} />, label: 'Girar', notImplemented: true },
    ];

    const roomEffects = [
         { icon: <RoomEffectsIcon className={iconClass} />, label: 'Efeitos de sala', notImplemented: true },
    ];

  return (
    <div 
      className="fixed inset-0 bg-transparent z-50 flex items-end"
      onClick={onClose}
    >
      <div 
        className="bg-[#212124]/95 backdrop-blur-md w-full rounded-t-2xl flex flex-col text-white animate-slide-up-fast max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b border-white/10 flex items-center justify-center relative shrink-0">
            <h2 className="font-bold text-lg">Ferramentas</h2>
            <button onClick={onClose} className="absolute top-1/2 -translate-y-1/2 right-4">
                <CrossIcon className="w-6 h-6 text-gray-400" />
            </button>
        </header>
        <div className="p-6 overflow-y-auto scrollbar-hide">
             <div className="bg-black rounded-lg aspect-video mb-6 overflow-hidden flex items-center justify-center">
                {mediaStream ? (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                ) : (
                    <div className="text-gray-500 text-sm">Câmera indisponível</div>
                )}
            </div>

             <Section title="Ferramentas de Co-host e PK">
                {pkTools.map(tool => <ToolButton key={tool.label} {...tool} />)}
            </Section>
            <Section title="Ferramentas de âncora">
                {anchorTools.map(tool => <ToolButton key={tool.label} {...tool} />)}
            </Section>
             <Section title="Ferramentas básicas">
                {basicTools.map(tool => <ToolButton key={tool.label} {...tool} />)}
            </Section>
            <Section title="Efeitos">
                {roomEffects.map(tool => <ToolButton key={tool.label} {...tool} />)}
            </Section>
        </div>
      </div>
       <style>{`
        @keyframes slide-up-fast { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up-fast { animation: slide-up-fast 0.25s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default ArcoraToolModal;
