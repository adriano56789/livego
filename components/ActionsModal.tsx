
import React from 'react';
import type { PublicProfile } from '../types';

interface ActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: PublicProfile;
  onBlock: () => void;
  onReport: () => void;
  onViewProfile?: () => void;
}

const ActionsModal: React.FC<ActionsModalProps> = ({ isOpen, onClose, user, onBlock, onReport, onViewProfile }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-end justify-center z-[70]"
      onClick={onClose}
    >
      <div 
        className="bg-[#1c1c1e] w-full max-w-md p-2 flex flex-col gap-2 animate-slide-up-fast"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-[#2c2c2e] rounded-xl">
            {onViewProfile && (
              <>
                <button onClick={onViewProfile} className="w-full text-center p-3.5 text-blue-400 text-lg">
                    Ver perfil
                </button>
                <div className="h-px bg-gray-600/50 mx-4"></div>
              </>
            )}
            <button onClick={onBlock} className="w-full text-center p-3.5 text-red-500 text-lg">
                Bloquear
            </button>
            <div className="h-px bg-gray-600/50 mx-4"></div>
            <button onClick={onReport} className="w-full text-center p-3.5 text-red-500 text-lg">
                Denunciar Usuário
            </button>
        </div>
        <button onClick={onClose} className="w-full text-center p-3.5 bg-[#2c2c2e] rounded-xl text-blue-400 text-lg font-semibold">
            Cancelar
        </button>
      </div>
    </div>
  );
};

export default ActionsModal;