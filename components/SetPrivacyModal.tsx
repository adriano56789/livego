import React, { useState, useEffect } from 'react';
import CrossIcon from './icons/CrossIcon';
import ToggleSwitch from './ToggleSwitch';
import DiamondIcon from './icons/DiamondIcon';

interface SetPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: { isPrivate: boolean, entryFee?: number }) => void;
  initialIsPrivate: boolean;
  initialEntryFee: number | null;
}

const SetPrivacyModal: React.FC<SetPrivacyModalProps> = ({ isOpen, onClose, onSave, initialIsPrivate, initialEntryFee }) => {
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate);
  const [entryFee, setEntryFee] = useState(initialEntryFee ? String(initialEntryFee) : '');

  useEffect(() => {
    setIsPrivate(initialIsPrivate);
    setEntryFee(initialEntryFee ? String(initialEntryFee) : '');
  }, [initialIsPrivate, initialEntryFee]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      isPrivate,
      entryFee: isPrivate ? parseInt(entryFee, 10) || 0 : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={onClose}>
      <div 
        className="bg-[#1C1F24] w-full max-w-md mx-auto rounded-t-2xl flex flex-col text-white animate-slide-up-fast"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 flex items-center justify-between border-b border-gray-700/50">
          <h2 className="font-bold text-lg">Configurações de Privacidade</h2>
          <button onClick={onClose} className="p-1 -m-1"><CrossIcon className="w-6 h-6 text-gray-400" /></button>
        </header>

        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base">Live Privada</h3>
              <p className="text-sm text-gray-400">Quando ativado, sua live não será pública.</p>
            </div>
            <ToggleSwitch enabled={isPrivate} onChange={setIsPrivate} />
          </div>

          {isPrivate && (
            <div>
              <label htmlFor="entry-fee" className="font-semibold text-base">Taxa de Entrada</label>
              <div className="relative mt-2">
                <DiamondIcon className="w-5 h-5 text-yellow-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="entry-fee"
                  type="number"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  placeholder="0 (Grátis)"
                  className="w-full bg-[#2c2c2e] h-12 rounded-lg pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="0"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Defina um preço em diamantes para entrar na sua live. Deixe em branco ou 0 para entrada gratuita.</p>
            </div>
          )}
        </main>
        
        <footer className="p-4 border-t border-gray-700/50">
          <button 
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-3 rounded-full text-lg shadow-lg hover:opacity-90 transition-opacity"
          >
            Salvar Alterações
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SetPrivacyModal;