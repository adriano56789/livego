import React, { useState, useEffect } from 'react';
import { CloseIcon, CheckIcon } from '../../icons';
import { User } from '../../../types';

type Gender = User['gender'];

interface EditGenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: Gender) => void;
  initialValue: Gender;
}

const EditGenderModal: React.FC<EditGenderModalProps> = ({ isOpen, onClose, onSave, initialValue }) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue || 'not_specified');
    }
  }, [isOpen, initialValue]);

  const handleSave = () => {
    onSave(value);
  };

  const options: { value: Gender; label: string }[] = [
    { value: 'male', label: 'Masculino' },
    { value: 'female', label: 'Feminino' },
    { value: 'not_specified', label: 'Não especificado' },
  ];

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1c1c1e] rounded-2xl p-4 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Gênero</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
        </div>
        <div className="space-y-2">
            {options.map(option => (
                <button key={option.value} onClick={() => setValue(option.value)} className="w-full flex justify-between items-center p-4 bg-[#2c2c2e] rounded-lg text-left hover:bg-gray-700/50 transition-colors">
                    <p className="text-white">{option.label}</p>
                    {value === option.value && <CheckIcon className="w-6 h-6 text-purple-400" />}
                </button>
            ))}
        </div>
        <div className="mt-6 flex justify-end">
            <button onClick={handleSave} className="bg-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-purple-700 transition-colors">Salvar</button>
        </div>
      </div>
    </div>
  );
};

export default EditGenderModal;