import React, { useState, useEffect } from 'react';
import { CloseIcon } from '../../icons';

interface EditTextAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  title: string;
  initialValue: string;
}

const EditTextAreaModal: React.FC<EditTextAreaModalProps> = ({ isOpen, onClose, onSave, title, initialValue }) => {
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
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4" 
      onClick={onClose}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        padding: '1rem',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        alignItems: 'flex-start',
        paddingTop: '10%',
      }}
    >
      <div 
        className="bg-[#1c1c1e] rounded-2xl p-4 w-full max-w-sm flex flex-col" 
        onClick={e => e.stopPropagation()}
        style={{
          maxHeight: '80vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-grow flex flex-col">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full flex-grow bg-[#2c2c2e] border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
            style={{
              minHeight: '120px',
              maxHeight: '40vh',
            }}
            autoFocus
          />
          <div className="mt-6 flex justify-end space-x-3 flex-shrink-0">
            <button 
              onClick={onClose} 
              className="bg-gray-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-gray-500 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave} 
              className="bg-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-purple-700 transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTextAreaModal;