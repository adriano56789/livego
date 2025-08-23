import React from 'react';

interface EndStreamConfirmationModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
}

const EndStreamConfirmationModal: React.FC<EndStreamConfirmationModalProps> = ({ onConfirm, onCancel, title, message, confirmText }) => {
  return (
    <div className="fixed inset-0 z-50 bg-transparent flex items-end justify-center" onClick={onCancel}>
      <div 
        className="bg-[#1c1c1e] w-full rounded-t-xl p-4 flex flex-col gap-4 animate-slide-up-fast"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center py-2">
            <h2 className="text-xl font-bold text-white">{title || 'Encerrar Transmissão?'}</h2>
            <p className="text-gray-400 mt-2 text-sm">{message || 'Tem certeza que deseja encerrar a transmissão? Esta ação não pode ser desfeita.'}</p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            className="w-full bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-500 transition-colors"
          >
            {confirmText || 'Encerrar'}
          </button>
          <button
            onClick={onCancel}
            className="w-full bg-[#2c2c2e] text-white font-semibold py-3 rounded-xl hover:bg-[#3a3a3c] transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndStreamConfirmationModal;