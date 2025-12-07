import React, { useEffect } from 'react';
import { CloseIcon } from './icons';

interface ImageViewerProps {
  imageUrl: string;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl, onClose }) => {
  // Bloquear o scroll da página quando o visualizador estiver aberto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 z-10 hover:bg-black/70 transition-colors"
          aria-label="Fechar visualizador"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
        <div className="max-w-full max-h-full">
          <img 
            src={imageUrl} 
            alt="Visualização em tela cheia" 
            className="max-w-full max-h-[90vh] object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;
