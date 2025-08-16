import React, { useState } from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

interface PkSettingsModalProps {
  onClose: () => void;
  onSave: (settings: { duration: number }) => void;
}

const timeOptions = [7, 5, 12, 20];

const PkSettingsModal: React.FC<PkSettingsModalProps> = ({ onClose, onSave }) => {
  const [selectedTime, setSelectedTime] = useState(7);

  const handleSave = () => {
    onSave({ duration: selectedTime });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-2xl flex flex-col text-black animate-slide-up-fast"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 flex items-center justify-between border-b border-gray-200">
          <button onClick={onClose}><ArrowLeftIcon className="w-6 h-6" /></button>
          <h2 className="font-bold text-lg">Configurações</h2>
          <div className="w-6 h-6"></div> {/* Spacer */}
        </header>

        <main className="p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Horário</h3>
          <div className="grid grid-cols-4 gap-3">
            {timeOptions.map(time => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`py-2 rounded-full font-semibold transition-colors ${
                  selectedTime === time
                    ? 'bg-purple-200 text-purple-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {time} mins
              </button>
            ))}
          </div>
        </main>

        <footer className="p-6">
          <button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-3 rounded-full text-lg shadow-lg"
          >
            Salvar
          </button>
        </footer>
      </div>
       <style>{`
        @keyframes slide-up-fast { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up-fast { animation: slide-up-fast 0.25s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default PkSettingsModal;
