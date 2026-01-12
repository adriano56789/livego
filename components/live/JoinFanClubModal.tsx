
import React from 'react';

interface JoinFanClubModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function JoinFanClubModal({ isOpen, onClose, onConfirm }: JoinFanClubModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-transparent pointer-events-none">
             <div 
                className="bg-[#1C1C1E] w-[280px] p-6 rounded-[28px] text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 pointer-events-auto transform animate-in zoom-in-95 duration-200" 
                onClick={e => e.stopPropagation()}
             >
                 <h2 className="text-white font-bold text-lg mb-3">Confirmar</h2>
                 
                 <p className="text-gray-300 text-[14px] mb-8 leading-tight px-1">
                     Enviar presente especial para entrar no grupo de fãs?
                 </p>

                 <div className="flex flex-col gap-2">
                    <button 
                        onClick={onConfirm} 
                        className="w-full bg-[#FE2C55] text-white py-3 rounded-full font-bold text-sm active:opacity-80 transition-all"
                    >
                        Confirmar
                    </button>
                    
                    <button 
                        onClick={onClose} 
                        className="w-full bg-transparent text-gray-400 py-2 rounded-full font-bold text-sm active:text-white transition-all"
                    >
                        Cancelar
                    </button>
                 </div>
             </div>
        </div>
    );
}
