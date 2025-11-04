import React from 'react';
import { DiamondIcon, FanGroupSignIcon } from '../icons';

interface JoinFanClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const JoinFanClubModal: React.FC<JoinFanClubModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <div
      className={`absolute inset-0 z-[101] flex items-end justify-center bg-black/10 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`w-full max-w-md bg-[#1C1C1E] rounded-t-2xl shadow-lg transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 text-center text-gray-200">
            <p className="text-lg font-medium mb-4">
                Envie o presente sinal de luz do ventilador para o streamer ao vivo.
            </p>
            
            <div className="flex flex-col items-center my-6">
                <FanGroupSignIcon className="w-24 h-auto" />
                <p className="mt-2 text-base text-white">sinal de luz do ventilador</p>
                <div className="flex items-center space-x-1 text-sm text-gray-400 mt-1">
                    <span>10</span>
                    <DiamondIcon className="w-4 h-4 text-yellow-500" />
                </div>
            </div>

            <button 
                onClick={onConfirm}
                className="w-full bg-[#FE397D] text-white font-bold py-3.5 rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-pink-500/30 text-lg"
            >
                Enviar e Juntar-se
            </button>
        </div>
      </div>
    </div>
  );
};

export default JoinFanClubModal;
