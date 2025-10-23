import React, { useState } from 'react';

interface PKBattleTimerSettingsScreenProps {
  isOpen: boolean;
  onBack: () => void;
  onSave: (duration: number) => void;
}

const PKBattleTimerSettingsScreen: React.FC<PKBattleTimerSettingsScreenProps> = ({ isOpen, onBack, onSave }) => {
  const timeOptions = [7, 5, 12, 20];
  const [selectedTime, setSelectedTime] = useState<number>(timeOptions[0]);

  const handleSave = () => {
    onSave(selectedTime);
  };

  return (
    <div
      className={`absolute inset-0 z-[60] flex items-end justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={onBack}
    >
      <div
        className={`bg-[#1C1C1E] rounded-t-2xl p-6 w-full max-w-md transition-transform duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        onClick={e => e.stopPropagation()}
      >
        <header className="text-center mb-4">
          <h1 className="text-xl font-bold">Configurações</h1>
        </header>

        <main>
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Horário</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {timeOptions.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`px-6 py-2 rounded-full font-semibold text-base transition-colors ${
                  selectedTime === time
                    ? 'bg-purple-600 text-white'
                    : 'bg-[#2C2C2E] text-gray-200 hover:bg-gray-700'
                }`}
              >
                {time} mins
              </button>
            ))}
          </div>
        </main>

        <footer className="pt-6">
          <button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white font-bold py-3 rounded-full text-lg shadow-lg hover:opacity-90 transition-opacity"
          >
            Salvar
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PKBattleTimerSettingsScreen;