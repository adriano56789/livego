import React, { useState, useEffect } from 'react';
import type { RouletteSettings } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import CrossIcon from './icons/CrossIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import DiamondIcon from './icons/DiamondIcon';
import ToggleSwitch from './ToggleSwitch';

interface RouletteSetupModalProps {
  liveId: number;
  initialSettings: RouletteSettings | null;
  onClose: () => void;
  onUpdateSettings: (settings: RouletteSettings) => void;
}

const RouletteSetupModal: React.FC<RouletteSetupModalProps> = ({ liveId, initialSettings, onClose, onUpdateSettings }) => {
  const [isActive, setIsActive] = useState(initialSettings?.isActive || false);
  const [items, setItems] = useState(initialSettings?.items || ['', '', '', '', '', '']);
  const [cost, setCost] = useState(initialSettings?.cost || 10);
  const [isSaving, setIsSaving] = useState(false);

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };
  
  const handleAddItem = () => {
      if (items.length < 8) {
          setItems([...items, '']);
      }
  };

  const handleRemoveItem = (index: number) => {
      if (items.length > 2) {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
      }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const validItems = items.map(item => item.trim()).filter(item => item !== '');
    if (validItems.length < 2) {
        alert("A roleta precisa de pelo menos 2 itens.");
        setIsSaving(false);
        return;
    }
    const settings: RouletteSettings = {
      isActive,
      items: validItems,
      cost: Number(cost) || 0,
    };
    try {
      await liveStreamService.updateRouletteSettings(liveId, settings);
      onUpdateSettings(settings);
      onClose();
    } catch (error) {
      console.error("Failed to save roulette settings:", error);
      alert("Falha ao salvar as configurações da roleta.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-[#1c1c1e] rounded-2xl w-full max-w-sm flex flex-col text-white animate-fade-in-fast"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 flex items-center justify-between border-b border-gray-700">
          <h2 className="font-bold text-lg">Configurar Roleta da Sorte</h2>
          <button onClick={onClose} className="p-1 -m-1"><CrossIcon className="w-6 h-6 text-gray-400" /></button>
        </header>

        <main className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
          <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
            <span className="font-semibold">Ativar Roleta na Live</span>
            <ToggleSwitch enabled={isActive} onChange={setIsActive} />
          </div>
          <div>
            <label className="font-semibold text-gray-300">Itens da Roleta (2-8)</label>
            <div className="space-y-2 mt-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleItemChange(index, e.target.value)}
                    placeholder={`Opção ${index + 1}`}
                    maxLength={20}
                    className="w-full bg-[#2c2c2e] h-10 rounded-md px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  {items.length > 2 && (
                    <button onClick={() => handleRemoveItem(index)} className="p-2 bg-red-800/50 rounded-md hover:bg-red-700/50">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              {items.length < 8 && (
                 <button onClick={handleAddItem} className="w-full flex items-center justify-center gap-2 text-sm text-purple-400 p-2 border-2 border-dashed border-gray-600 rounded-lg hover:bg-gray-700/50">
                    <PlusIcon className="w-4 h-4" /> Adicionar Opção
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
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 font-bold py-3 rounded-full text-lg shadow-lg disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : 'Salvar e Fechar'}
          </button>
        </footer>
      </div>
    </div>
  );
};
export default RouletteSetupModal;
