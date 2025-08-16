import React from 'react';
import BlockedIcon from './icons/BlockedIcon';
import CrossIcon from './icons/CrossIcon';

interface BlockScreenProps {
  userName: string;
  onUnblock: () => void;
  onExit: () => void;
  bgColor?: string; // Optional background color to match parent context
}

const BlockScreen: React.FC<BlockScreenProps> = ({ userName, onUnblock, onExit, bgColor = 'bg-[#1e1e1e]' }) => {
  return (
    <div className={`w-full h-full ${bgColor} text-white flex flex-col font-sans p-4`}>
        <header className="flex items-center justify-end shrink-0">
            <button onClick={onExit} className="p-2 -m-2">
                <CrossIcon className="w-6 h-6" />
            </button>
        </header>
        <main className="flex-grow flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 flex items-center justify-center bg-gray-700/50 rounded-full mb-6">
                <BlockedIcon className="w-16 h-16 text-gray-400" />
            </div>
            <p className="text-xl text-gray-300">
                Você bloqueou <span className="font-bold text-white">{userName}</span> com sucesso
            </p>
            <button
                onClick={onUnblock}
                className="mt-8 bg-green-500 text-black font-semibold py-3 px-12 rounded-full text-lg transition-opacity hover:opacity-90"
            >
                Desbloquear
            </button>
        </main>
    </div>
  );
};

export default BlockScreen;