
import React from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import InfoIcon from './icons/InfoIcon';

interface AppVersionScreenProps {
  currentVersion: string;
  latestVersion: string;
  onExit: () => void;
}

const AppVersionScreen: React.FC<AppVersionScreenProps> = ({ currentVersion, latestVersion, onExit }) => {
  const isUpToDate = currentVersion === latestVersion;

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
      <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-800">
        <button onClick={onExit}><ArrowLeftIcon className="w-6 h-6" /></button>
        <h1 className="font-bold text-lg">Versão do App</h1>
        <div className="w-6 h-6"></div>
      </header>
      <main className="flex-grow p-6 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 flex items-center justify-center bg-gray-800/50 rounded-full mb-6">
            <InfoIcon className="w-16 h-16 text-gray-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-white">LiveGo</h2>
        <p className="text-gray-400 mt-2">Sua versão atual é {currentVersion}</p>
        
        <div className="mt-8 bg-[#1c1c1c] p-4 rounded-lg w-full max-w-sm">
            <div className="flex justify-between items-center">
                <span className="text-gray-300">Última Versão</span>
                <span className="font-semibold text-white">{latestVersion}</span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700/50 flex justify-between items-center">
                <span className="text-gray-300">Status</span>
                {isUpToDate ? (
                    <span className="font-semibold text-green-400">Atualizado</span>
                ) : (
                    <span className="font-semibold text-yellow-400">Atualização disponível</span>
                )}
            </div>
        </div>

      </main>
    </div>
  );
};

export default AppVersionScreen;
