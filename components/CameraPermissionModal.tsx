import React, { useState, useEffect } from 'react';
import { CameraIcon, MicrophoneIcon, RefreshIcon } from './icons';

interface CameraPermissionModalProps {
  isOpen: boolean;
  permissionType: 'idle' | 'camera' | 'microphone';
  onAllowAlways: () => void;
  onAllowOnce: () => void;
  onDeny: () => void;
  onClose: () => void;
  error?: string | null;
}

const CameraPermissionModal: React.FC<CameraPermissionModalProps> = ({ 
  isOpen, 
  permissionType, 
  onAllowAlways, 
  onAllowOnce, 
  onDeny, 
  onClose,
  error 
}) => {
  const [showDeniedMessage, setShowDeniedMessage] = useState(false);

  useEffect(() => {
    if (error && error.includes('NotAllowedError')) {
      setShowDeniedMessage(true);
    }
  }, [error]);

  const handleDeny = () => {
    setShowDeniedMessage(true);
    onDeny();
  };

  const handleRetry = () => {
    setShowDeniedMessage(false);
    onAllowOnce();
  };
  const contentMap = {
    camera: {
      icon: <CameraIcon className="w-10 h-10 text-gray-300" />,
      title: 'Permitir que o app LiveGo tire fotos e grave vídeos?',
      deniedMessage: 'Permissão de câmera negada. Vá nas configurações do navegador e habilite a câmera para este site.'
    },
    microphone: {
      icon: <MicrophoneIcon className="w-10 h-10 text-gray-300" />,
      title: 'Permitir que o app LiveGo grave áudio?',
      deniedMessage: 'Permissão de microfone negada. Vá nas configurações do navegador e habilite o microfone para este site.'
    },
  };

  if (!isOpen || permissionType === 'idle') {
    return null;
  }
  
  const currentContent = contentMap[permissionType];
  
  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-300 bg-black/50 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`bg-[#2c2c2e] rounded-t-2xl p-6 w-full max-w-md text-center text-white transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4">
          {currentContent.icon}
        </div>
        
        {showDeniedMessage ? (
          <>
            <h2 className="text-xl font-semibold mb-2 text-red-400">Permissão Negada</h2>
            <p className="text-gray-300 mb-6 text-sm px-4">
              {currentContent.deniedMessage}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full bg-[#007aff] text-white font-semibold rounded-xl py-3 px-4 text-base flex items-center justify-center gap-2"
              >
                <RefreshIcon className="w-5 h-5" />
                Tentar novamente
              </button>
              <button
                onClick={onClose}
                className="w-full bg-[#3c3c3e] text-white font-semibold rounded-xl py-3 px-4 text-base"
              >
                Fechar
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-6">{currentContent.title}</h2>
            <div className="space-y-3">
              <button
                onClick={onAllowAlways}
                className="w-full bg-[#007aff] text-white font-semibold rounded-xl py-3 px-4 text-base"
              >
                Durante o uso do app
              </button>
              <button
                onClick={onAllowOnce}
                className="w-full bg-[#3c3c3e] text-white font-semibold rounded-xl py-3 px-4 text-base"
              >
                Apenas esta vez
              </button>
              <button
                onClick={handleDeny}
                className="w-full bg-[#3c3c3e] text-white font-semibold rounded-xl py-3 px-4 text-base"
              >
                Não permitir
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraPermissionModal;