import React from 'react';
import { BackIcon } from '../icons';

const AppVersionScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="flex flex-col h-full bg-[#111]">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-white/5">
                <button onClick={onBack}><BackIcon className="w-6 h-6 text-white" /></button>
                <div className="flex-grow text-center mr-6"><h1 className="text-lg font-bold text-white">Sobre</h1></div>
            </header>
            <div className="flex-grow flex flex-col items-center justify-center p-10 text-center">
                <div className="w-20 h-20 bg-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-purple-900/40">
                    <span className="text-white font-black text-2xl italic">LG</span>
                </div>
                <h2 className="text-white font-bold text-xl mb-1">LiveGo Premium</h2>
                <p className="text-gray-500 text-sm">Versão 1.0.0 (Build 2024.01)</p>
                <p className="text-gray-700 text-xs mt-10">© 2024 LiveGo Inc. Todos os direitos reservados.</p>
            </div>
        </div>
    );
};

export default AppVersionScreen;