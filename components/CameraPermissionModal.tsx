import React from 'react';
import { CameraIcon, MicrophoneIcon } from './icons';

interface CameraPermissionModalProps {
  isOpen: boolean;
  permissionType: 'idle' | 'camera' | 'microphone';
  onAllowAlways: () => void | Promise<void>;
  onAllowOnce: () => void | Promise<void>;
  onDeny: () => void | Promise<void>;
  onClose: () => void;
  error?: string;
}

const CameraPermissionModal: React.FC<CameraPermissionModalProps> = ({ isOpen, permissionType, onAllowAlways, onAllowOnce, onDeny, onClose }) => {
  const contentMap = {
    camera: {
      icon: <CameraIcon className="w-8 h-8 text-gray-300" />,
      title: 'Permitir que o app LiveGo tire fotos e grave vídeos?',
    },
    microphone: {
      icon: <MicrophoneIcon className="w-8 h-8 text-gray-300" />,
      title: 'Permitir que o app LiveGo grave áudio?',
    },
  };

  if (!isOpen || permissionType === 'idle') {
    return null;
  }
  
  const currentContent = contentMap[permissionType];
  
  return (
    <div
      className={`absolute inset-0 z-50 flex items-end justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
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
        <h2 className="text-lg font-semibold mb-6">{currentContent.title}</h2>
        <div className="flex flex-col space-y-3">
          <button
            onClick={onAllowAlways}
            className="w-full bg-[#007aff] text-white font-semibold rounded-xl py-3 px-4 text-base hover:bg-blue-600 transition-colors"
          >
            Durante o uso do app
          </button>
          <button
            onClick={onAllowOnce}
            className="w-full bg-[#3c3c3e] text-white font-semibold rounded-xl py-3 px-4 text-base hover:bg-gray-700 transition-colors"
          >
            Apenas esta vez
          </button>
          <button
            onClick={onDeny}
            className="w-full bg-[#3c3c3e] text-white font-semibold rounded-xl py-3 px-4 text-base hover:bg-gray-700 transition-colors"
          >
            Não permitir
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraPermissionModal;