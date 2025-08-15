import React from 'react';
import CadeadoFechadoBeloIcon from './icons/CadeadoFechadoBeloIcon';

interface PrivateLiveBlockedScreenProps {
  onExit: () => void;
}

const PrivateLiveBlockedScreen: React.FC<PrivateLiveBlockedScreenProps> = ({ onExit }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center text-white p-6 text-center font-sans">
        <div className="w-24 h-24 flex items-center justify-center bg-gray-800 rounded-full mb-6">
            <CadeadoFechadoBeloIcon className="w-14 h-14 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold">Esta é uma live privada.</h1>
        <p className="text-gray-400 mt-2 max-w-sm">Apenas amigos convidados podem entrar. Fale com o anfitrião para obter um convite.</p>
        <button
            onClick={onExit}
            className="mt-8 bg-green-500 text-black font-semibold py-3 px-16 rounded-full text-lg transition-opacity hover:opacity-90"
        >
            OK
        </button>
    </div>
  );
};

export default PrivateLiveBlockedScreen;
