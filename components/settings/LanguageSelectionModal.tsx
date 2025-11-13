import React, { useState, useEffect } from 'react';
import { CloseIcon, CheckIcon } from '../icons';

interface LanguageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
  onSave: (language: string) => void;
}

const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({ isOpen, onClose, currentLanguage, onSave }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);

  useEffect(() => {
    if (isOpen) {
      setSelectedLanguage(currentLanguage);
    }
  }, [isOpen, currentLanguage]);

  const handleSave = () => {
    onSave(selectedLanguage);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-[#1c1c1e] rounded-2xl p-4 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Selecionar Idioma</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => setSelectedLanguage('pt')}
            className="w-full flex justify-between items-center p-4 bg-[#2c2c2e] rounded-lg text-left hover:bg-gray-700/50 transition-colors"
          >
            <p className="text-white">Português (Brasil)</p>
            {selectedLanguage === 'pt' && <CheckIcon className="w-6 h-6 text-purple-400" />}
          </button>
          <button
            onClick={() => setSelectedLanguage('en')}
            className="w-full flex justify-between items-center p-4 bg-[#2c2c2e] rounded-lg text-left hover:bg-gray-700/50 transition-colors"
          >
            <p className="text-white">English</p>
            {selectedLanguage === 'en' && <CheckIcon className="w-6 h-6 text-purple-400" />}
          </button>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={handleSave} className="bg-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-purple-700 transition-colors">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelectionModal;