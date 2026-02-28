import React from 'react';

interface EndStreamConfirmationModalProps {
    onCancel: () => void;
    onConfirm: () => void;
    isPK?: boolean;
}

const EndStreamConfirmationModal: React.FC<EndStreamConfirmationModalProps> = ({ onCancel, onConfirm, isPK = false }) => (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
        <div className="bg-[#111111] p-8 rounded-2xl text-center max-w-sm w-full shadow-lg" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-3">{isPK ? "Sair da Batalha?" : "Encerrar Transmissão?"}</h2>
            <p className="text-gray-300 mb-8">{isPK ? "Tem certeza que quer sair da batalha de PK?" : "Tem certeza que deseja encerrar a transmissão? Esta ação não pode ser desfeita."}</p>
            <div className="flex flex-col space-y-3">
                <button 
                    onClick={onConfirm} 
                    className="w-full bg-red-600 px-4 py-3 rounded-xl text-white font-semibold hover:bg-red-700 transition-colors text-lg"
                >
                    {isPK ? "Sair" : "Encerrar"}
                </button>
                <button 
                    onClick={onCancel} 
                    className="w-full bg-[#3c3c3e] px-4 py-3 rounded-xl text-white font-semibold hover:bg-gray-600 transition-colors text-lg"
                >
                    Cancelar
                </button>
            </div>
        </div>
    </div>
);

export default EndStreamConfirmationModal;