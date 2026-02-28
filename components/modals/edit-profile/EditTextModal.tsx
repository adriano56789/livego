import React, { useState, useEffect } from 'react';
import { CloseIcon } from '../../icons';

interface EditTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  title: string;
  initialValue: string;
}

const EditTextModal: React.FC<EditTextModalProps> = ({ isOpen, onClose, onSave, title, initialValue }) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue || '');
    }
  }, [isOpen, initialValue]);

  const handleSave = () => {
    onSave(value);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1c1c1e] rounded-2xl p-4 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full bg-[#2c2c2e] border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          autoFocus
        />
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="bg-gray-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-gray-500 transition-colors">Cancelar</button>
          <button onClick={handleSave} className="bg-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-purple-700 transition-colors">Salvar</button>
        </div>
      </div>
    </div>
  );
};

export default EditTextModal;