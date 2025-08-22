import React from 'react';
import CrossIcon from './icons/CrossIcon';
import TrashIcon from './icons/TrashIcon';

interface PhotoViewerModalProps {
  photoUrl: string;
  onClose: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  canDelete: boolean;
}

const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({ photoUrl, onClose, onDelete, isDeleting, canDelete }) => (
    <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center" onClick={onClose}>
        <div className="relative animate-fade-in-fast" onClick={e => e.stopPropagation()}>
            <img src={photoUrl} alt="Visualização da foto" className="max-w-[90vw] max-h-[80vh] rounded-lg object-contain" />
            <button onClick={onClose} className="absolute -top-3 -right-3 bg-gray-800 rounded-full p-1.5">
                <CrossIcon className="w-5 h-5 text-white" />
            </button>
            {canDelete && (
                <button onClick={onDelete} disabled={isDeleting} className="absolute bottom-4 right-4 bg-red-600 rounded-full p-3 hover:bg-red-500 transition-colors disabled:opacity-50">
                    {isDeleting ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <TrashIcon className="w-6 h-6 text-white" />}
                </button>
            )}
        </div>
        <style>{`
            @keyframes fade-in-fast { 
                from { opacity: 0; transform: scale(0.95); } 
                to { opacity: 1; transform: scale(1); } 
            }
            .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
        `}</style>
    </div>
);

export default PhotoViewerModal;
