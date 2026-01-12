import React from 'react';
import { BackIcon } from '../icons';

const CopyrightScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="flex flex-col h-full bg-[#111]">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-white/5">
                <button onClick={onBack}><BackIcon className="w-6 h-6 text-white" /></button>
                <div className="flex-grow text-center mr-6"><h1 className="text-lg font-bold text-white">Direitos Autorais</h1></div>
            </header>
            <div className="p-6 text-gray-500 text-xs space-y-4">
                <p>Todo o conteúdo, design e código fonte do LiveGo Premium estão protegidos por leis internacionais de propriedade intelectual.</p>
                <p>A reprodução ou distribuição não autorizada deste software pode resultar em severas penalidades civis e criminais.</p>
            </div>
        </div>
    );
};

export default CopyrightScreen;