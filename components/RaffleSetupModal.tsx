import React, { useState } from 'react';
import CrossIcon from './icons/CrossIcon';
import DiamondIcon from './icons/DiamondIcon';

interface RaffleSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartRaffle: (settings: { prize: string; winnersCount: number; durationMinutes: number }) => void;
}

const OptionButton: React.FC<{ label: string; value: number; selectedValue: number; onSelect: (value: number) => void }> = ({ label, value, selectedValue, onSelect }) => (
    <button
        onClick={() => onSelect(value)}
        className={`flex-1 py-2.5 rounded-lg font-semibold transition-colors ${selectedValue === value ? 'bg-purple-600 text-white' : 'bg-[#2c2c2e] text-gray-300'}`}
    >
        {label}
    </button>
);


const RaffleSetupModal: React.FC<RaffleSetupModalProps> = ({ isOpen, onClose, onStartRaffle }) => {
    const [prize, setPrize] = useState('');
    const [winnersCount, setWinnersCount] = useState(1);
    const [durationMinutes, setDurationMinutes] = useState(5);
    const [isStarting, setIsStarting] = useState(false);

    const handleStart = () => {
        if (!prize.trim()) {
            alert("Por favor, defina um prêmio para o sorteio.");
            return;
        }
        setIsStarting(true);
        onStartRaffle({ prize, winnersCount, durationMinutes });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] bg-black/70 flex items-center justify-center p-4 font-sans animate-fade-in-fast" onClick={onClose}>
            <div 
                className="bg-[#1c1c1e] rounded-2xl w-full max-w-sm flex flex-col text-white"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 flex items-center justify-between border-b border-gray-700">
                    <h2 className="font-bold text-lg">Configurar Sorteio</h2>
                    <button onClick={onClose} className="p-1 -m-1"><CrossIcon className="w-6 h-6 text-gray-400" /></button>
                </header>
                <main className="p-6 space-y-6">
                    <div>
                        <label htmlFor="prize" className="font-semibold text-gray-300 mb-2 block">Prêmio do Sorteio</label>
                        <input
                            id="prize"
                            type="text"
                            value={prize}
                            onChange={(e) => setPrize(e.target.value)}
                            placeholder="Ex: 10.000 diamantes"
                            maxLength={50}
                            className="w-full bg-[#2c2c2e] h-11 rounded-lg px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label className="font-semibold text-gray-300 mb-2 block">Número de vencedores</label>
                        <div className="flex items-center gap-3">
                            <OptionButton label="1" value={1} selectedValue={winnersCount} onSelect={setWinnersCount} />
                            <OptionButton label="3" value={3} selectedValue={winnersCount} onSelect={setWinnersCount} />
                            <OptionButton label="5" value={5} selectedValue={winnersCount} onSelect={setWinnersCount} />
                        </div>
                    </div>
                     <div>
                        <label className="font-semibold text-gray-300 mb-2 block">Duração</label>
                        <div className="flex items-center gap-3">
                           <OptionButton label="1 min" value={1} selectedValue={durationMinutes} onSelect={setDurationMinutes} />
                           <OptionButton label="5 min" value={5} selectedValue={durationMinutes} onSelect={setDurationMinutes} />
                           <OptionButton label="10 min" value={10} selectedValue={durationMinutes} onSelect={setDurationMinutes} />
                        </div>
                    </div>
                </main>
                <footer className="p-4 border-t border-gray-700">
                    <button 
                        onClick={handleStart}
                        disabled={isStarting}
                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 font-bold py-3 rounded-full text-lg shadow-lg disabled:opacity-50"
                    >
                        {isStarting ? 'Iniciando...' : 'Iniciar Sorteio'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default RaffleSetupModal;