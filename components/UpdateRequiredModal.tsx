
import React from 'react';
import InfoIcon from './icons/InfoIcon';

interface UpdateRequiredModalProps {
  updateUrl: string;
}

const UpdateRequiredModal: React.FC<UpdateRequiredModalProps> = ({ updateUrl }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center text-white p-6 text-center font-sans">
      <div className="w-24 h-24 flex items-center justify-center bg-yellow-800/50 rounded-full mb-6">
        <InfoIcon className="w-16 h-16 text-yellow-400" />
      </div>
      <h1 className="text-2xl font-bold">Atualização Obrigatória</h1>
      <p className="text-gray-400 mt-2 max-w-sm">
        Para continuar usando o LiveGo, você precisa atualizar o aplicativo para a versão mais recente.
      </p>
      <a
        href={updateUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 block w-full max-w-xs bg-green-500 text-black font-semibold py-3 rounded-full text-lg transition-opacity hover:opacity-90"
      >
        Atualizar Agora
      </a>
    </div>
  );
};

export default UpdateRequiredModal;
