import React from 'react';
import { BackIcon } from '../icons';

const EarningsInfoScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="flex flex-col h-full bg-[#111]">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-white/5">
                <button onClick={onBack}><BackIcon className="w-6 h-6 text-white" /></button>
                <div className="flex-grow text-center mr-6"><h1 className="text-lg font-bold text-white">Informações de Ganhos</h1></div>
            </header>
            <div className="p-6 space-y-4 text-gray-400 text-sm leading-relaxed">
                <p>1. Os diamantes recebidos durante as lives são convertidos automaticamente em ganhos na sua carteira.</p>
                <p>2. A taxa da plataforma é de 20% sobre o valor bruto gerado.</p>
                <p>3. O valor mínimo para saque é de R$ 50,00.</p>
            </div>
        </div>
    );
};

export default EarningsInfoScreen;