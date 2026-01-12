import React from 'react';

interface EndStreamConfirmationModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const EndStreamConfirmationModal: React.FC<EndStreamConfirmationModalProps> = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/10 animate-in fade-in duration-200">
            <div 
                className="bg-white w-[80%] max-w-xs rounded-3xl p-6 flex flex-col items-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] transform transition-all scale-100 border border-white/20" 
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-black text-lg font-bold mb-2 text-center">Encerrar Transmissão?</h2>
                <p className="text-gray-500 text-xs text-center mb-6 leading-relaxed px-2 font-medium">
                    Tem certeza que deseja encerrar a transmissão? Esta ação não pode ser desfeita.
                </p>
                
                <div className="w-full space-y-3">
                    <button 
                        onClick={onConfirm}
                        className="w-full bg-[#ef4444] hover:bg-[#dc2626] active:scale-[0.98] text-white text-sm font-bold py-3 rounded-full transition-all shadow-lg shadow-red-500/30"
                    >
                        Encerrar
                    </button>
                    <button 
                        onClick={onCancel}
                        className="w-full bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-700 text-sm font-bold py-3 rounded-full transition-all"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EndStreamConfirmationModal;