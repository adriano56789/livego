
import React, { useState, useEffect } from 'react';
import CrossIcon from './icons/CrossIcon';
import * as liveStreamService from '../services/liveStreamService';

interface PkSettingsModalProps {
  userId: number;
  onClose: () => void;
}

const timeOptions = [
    { label: '2 mins', value: 120 },
    { label: '5 mins', value: 300 },
    { label: '30 mins', value: 1800 },
    { label: '60 mins', value: 3600 },
];

const PkSettingsModal: React.FC<PkSettingsModalProps> = ({ userId, onClose }) => {
  const [selectedTime, setSelectedTime] = useState(300); // Default to 5 mins
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const settings = await liveStreamService.getPkSettings(userId);
            setSelectedTime(settings.durationSeconds);
        } catch (error) {
            console.error("Failed to fetch PK settings", error);
            // Keep default value on error
        } finally {
            setIsLoading(false);
        }
    };
    fetchSettings();
  }, [userId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await liveStreamService.updatePkSettings(userId, selectedTime);
      onClose();
    } catch (error) {
        console.error("Failed to save PK settings", error);
        alert("Falha ao salvar as configurações.");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 flex items-end" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-2xl flex flex-col text-black animate-slide-up-fast"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 flex items-center justify-center relative border-b border-gray-200">
          <h2 className="font-bold text-lg">Configurações</h2>
           <button onClick={onClose} className="absolute top-1/2 right-4 -translate-y-1/2 p-2 -m-2">
            <CrossIcon className="w-6 h-6 text-gray-400" />
          </button>
        </header>

        <main className="p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Horário</h3>
           {isLoading ? (
            <div className="h-10 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
                {timeOptions.map(time => (
                    <button
                        key={time.value}
                        onClick={() => setSelectedTime(time.value)}
                        className={`py-2 rounded-full font-semibold transition-colors ${
                        selectedTime === time.value
                            ? 'bg-purple-200 text-purple-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {time.label}
                    </button>
                ))}
            </div>
          )}
        </main>

        <footer className="p-6">
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-3 rounded-full text-lg shadow-lg disabled:opacity-50 flex items-center justify-center"
          >
            {isSaving && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
            {isSaving ? 'Salvando...' : 'Salvar'}
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
