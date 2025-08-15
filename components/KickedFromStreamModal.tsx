
import React from 'react';
import BlockedIcon from './icons/BlockedIcon';

interface KickedFromStreamModalProps {
  onExit: () => void;
  isJoinAttempt?: boolean;
}

const KickedFromStreamModal: React.FC<KickedFromStreamModalProps> = ({ onExit, isJoinAttempt = false }) => {
  const title = isJoinAttempt ? "Acesso negado" : "Você foi removido da sala.";
  const message = isJoinAttempt
    ? "Você não pode entrar nesta sala porque foi removido pelo anfitrião."
    : "O anfitrião removeu você desta transmissão ao vivo.";

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex flex-col items-center justify-center text-white p-6 text-center font-sans">
        <div className="w-24 h-24 flex items-center justify-center bg-red-800/50 rounded-full mb-6">
            <BlockedIcon className="w-16 h-16 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-gray-400 mt-2 max-w-sm">{message}</p>
        <button
            onClick={onExit}
            className="mt-8 bg-green-500 text-black font-semibold py-3 px-16 rounded-full text-lg transition-opacity hover:opacity-90"
        >
            OK
        </button>
    </div>
  );
};

export default KickedFromStreamModal;
