
import React, { useState, useEffect } from 'react';
import CrossIcon from './icons/CrossIcon';
import DiamondIcon from './icons/DiamondIcon';
import TrashIcon from './icons/TrashIcon';
import PlusIcon from './icons/PlusIcon';

interface PrizeWheelSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: { prizes: string[], cost: number }) => void;
  initialPrizes: string[];
  initialCost: number;
}

const PrizeWheelSetupModal: React.FC<PrizeWheelSetupModalProps> = ({ isOpen, onClose, onSave, initialPrizes, initialCost }) => {
  const [prizes, setPrizes] = useState(initialPrizes);
  const [cost, setCost] = useState(initialCost);

  useEffect(() => {
    if (isOpen) {
      setPrizes(initialPrizes);
      setCost(initialCost);
    }
  }, [isOpen, initialPrizes, initialCost]);

  if (!isOpen) {
    return null;
  }

  const handlePrizeChange = (index: number, value: string) => {
    const newPrizes = [...prizes];
    newPrizes[index] = value;
    setPrizes(newPrizes);
  };
  
  const addPrizeSlot = () => {
    if (prizes.length < 12) {
        setPrizes([...prizes, '']);
    }
  };

  const removePrizeSlot = (index: number) => {
    if (prizes.length > 2) {
        setPrizes(prizes.filter((_, i) => i !== index));
    }
  };

  const handleSaveClick = () => {
    const finalPrizes = prizes.map(p => p.trim()).filter(p => p.length > 0);
    if (finalPrizes.length < 2) {
      alert("São necessários pelo menos 2 prêmios.");
      return;
    }
    onSave({ prizes: finalPrizes, cost });
  };


  return (
    <div className="fixed inset-0 z-[110] bg-black/70 flex items-center justify-center p-4 font-sans animate-fade-in-fast" onClick={onClose}>
      <div 
        className="bg-[#1c1c1e] rounded-2xl w-full max-w-sm flex flex-col text-white"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 flex items-center justify-between border-b border-gray-700">
          <h2 className="font-bold text-lg">Configurar Roleta</h2>
          <button onClick={onClose} className="p-1 -m-1"><CrossIcon className="w-6 h-6 text-gray-400" /></button>
        </header>

        <main className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          <div>
            <label className="font-semibold text-gray-300">Prêmios (2-12)</label>
            <div className="space-y-2 mt-2">
              {prizes.map((prize, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={prize}
                    onChange={(e) => handlePrizeChange(index, e.target.value)}
                    placeholder={`Prêmio ${index + 1}`}
                    maxLength={20}
                    className="w-full bg-[#2c2c2e] h-10 rounded-md px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  {prizes.length > 2 && (
                    <button onClick={() => removePrizeSlot(index)} className="p-2 bg-red-800/50 rounded-md hover:bg-red-700/50">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              {prizes.length < 12 && (
                 <button onClick={addPrizeSlot} className="w-full flex items-center justify-center gap-2 text-sm text-purple-400 p-2 border-2 border-dashed border-gray-600 rounded-lg hover:bg-gray-700/50">
                    <PlusIcon className="w-4 h-4" /> Adicionar Prêmio
                </button>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="cost" className="font-semibold text-gray-300">Custo por Giro</label>
            <div className="relative mt-2">
                <DiamondIcon className="w-5 h-5 text-yellow-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="cost"
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                  className="w-full bg-[#2c2c2e] h-11 rounded-lg pl-10 pr-4 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  min="0"
                />
            </div>
          </div>
        </main>

        <footer className="p-4 border-t border-gray-700">
          <button 
            onClick={handleSaveClick}
            className="w-full bg-purple-600 text-white font-bold py-3 rounded-full text-lg hover:bg-purple-500 transition-colors"
          >
            Salvar
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PrizeWheelSetupModal;
