import React from 'react';

interface EndStreamConfirmationModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const EndStreamConfirmationModal: React.FC<EndStreamConfirmationModalProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 font-sans">
      <div className="bg-[#1c1c1e] rounded-2xl p-6 text-center w-full max-w-sm animate-fade-in-fast">
        <h2 className="text-xl font-bold text-white">Encerrar Transmissão?</h2>
        <p className="text-gray-400 mt-2">Tem certeza que deseja encerrar a transmissão? Esta ação não pode ser desfeita.</p>
        <div className="flex gap-4 mt-6">
          <button
            onClick={onCancel}
            className="w-full bg-[#2c2c2e] text-white font-semibold py-3 rounded-full hover:bg-[#3a3a3c] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="w-full bg-red-600 text-white font-semibold py-3 rounded-full hover:bg-red-500 transition-colors"
          >
            Encerrar
          </button>
        </div>
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
};

export default EndStreamConfirmationModal;