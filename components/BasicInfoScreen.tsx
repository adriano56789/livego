import React, { useState } from 'react';
import { BackIcon, CheckIcon, CloseIcon } from './icons';

interface BasicInfoScreenProps {
    onBack: () => void;
    onNext: () => void;
}

const months = [
    { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' }
];

const genders = [
    { value: 'female', label: 'Feminino' },
    { value: 'male', label: 'Masculino' },
    { value: 'not_specified', label: 'Prefiro não dizer' },
    { value: 'custom', label: 'Personalizado' }
];

interface SelectionModalProps<T> {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (value: T) => void;
    currentValue: T;
    options: { value: T; label: string }[];
    title: string;
}

const SelectionModal = <T extends string>({ isOpen, onClose, onSelect, currentValue, options, title }: SelectionModalProps<T>) => {
    if (!isOpen) return null;

    return (
        <div 
          className={`absolute inset-0 z-50 flex items-end justify-center transition-opacity duration-300 ${isOpen ? 'bg-black/60 opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={onClose}
        >
            <div
                className={`bg-[#1C1C1E] w-full max-w-md rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ maxHeight: '70vh' }}
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-700/50 flex-shrink-0">
                    <h2 className="text-lg font-semibold text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-300 hover:text-white">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                <main className="flex-grow overflow-y-auto no-scrollbar">
                    <ul>
                        {options.map(option => (
                            <li key={option.value}>
                                <button 
                                    onClick={() => onSelect(option.value)}
                                    className="w-full flex justify-between items-center text-left px-6 py-4 text-base text-white hover:bg-gray-800/50 transition-colors"
                                >
                                    {option.label}
                                    {currentValue === option.value && <CheckIcon className="w-5 h-5 text-blue-400" />}
                                </button>
                            </li>
                        ))}
                    </ul>
                </main>
            </div>
        </div>
    );
};


const BasicInfoScreen: React.FC<BasicInfoScreenProps> = ({ onBack, onNext }) => {
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [gender, setGender] = useState('');

    const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
    const [isGenderModalOpen, setIsGenderModalOpen] = useState(false);

    const isFormValid = day.trim() !== '' && month !== '' && year.trim() !== '' && gender !== '';

    const inputClasses = "w-full px-4 py-3.5 bg-transparent rounded border border-gray-600 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-colors text-base";
    const selectButtonClasses = `${inputClasses} text-left relative`;
    const selectArrowStyle = {
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundPosition: 'right 0.5rem center',
        backgroundSize: '1.5em 1.5em',
        backgroundRepeat: 'no-repeat'
    };
    
    const selectedMonthLabel = months.find(m => m.value === month)?.label;
    const selectedGenderLabel = genders.find(g => g.value === gender)?.label;

    return (
        <div className="bg-black h-screen w-screen text-white flex flex-col px-8 pt-16 pb-8 font-sans">
            <div className="flex-grow flex flex-col">
                <div className="w-full max-w-md mx-auto">
                    <h1 className="text-2xl mb-8">Google</h1>
                    
                    <h2 className="text-3xl text-white mb-2">Informações básicas</h2>
                    <p className="text-gray-400 text-base mb-8">
                        Digite sua data de nascimento e gênero
                    </p>

                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            <input 
                                type="number" 
                                placeholder="Dia" 
                                value={day} 
                                onChange={e => setDay(e.target.value)} 
                                className={inputClasses}
                            />
                            <button onClick={() => setIsMonthModalOpen(true)} className={`${selectButtonClasses} ${month ? 'text-white' : 'text-gray-400'}`} style={selectArrowStyle}>
                                {selectedMonthLabel || 'Mês'}
                            </button>
                            <input 
                                type="number" 
                                placeholder="Ano" 
                                value={year} 
                                onChange={e => setYear(e.target.value)} 
                                className={inputClasses}
                             />
                        </div>
                        <button onClick={() => setIsGenderModalOpen(true)} className={`${selectButtonClasses} ${gender ? 'text-white' : 'text-gray-400'}`} style={selectArrowStyle}>
                            {selectedGenderLabel || 'Gênero'}
                        </button>
                    </div>
                    
                    <button className="block text-blue-400 font-semibold mt-6 text-sm hover:underline p-1 -ml-1">
                        Por que pedimos informações de data de nascimento e gênero
                    </button>
                </div>
            </div>

            <div className="flex justify-end items-center flex-shrink-0 w-full max-w-md mx-auto">
                <button
                    onClick={onNext}
                    disabled={!isFormValid}
                    className="bg-[#8ab4f8] text-black font-semibold px-6 py-2.5 rounded text-sm hover:opacity-90 transition-opacity disabled:bg-[#3c4043] disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                    Avançar
                </button>
            </div>
            
            <SelectionModal 
                isOpen={isMonthModalOpen}
                onClose={() => setIsMonthModalOpen(false)}
                onSelect={(value) => { setMonth(value); setIsMonthModalOpen(false); }}
                currentValue={month}
                options={months}
                title="Selecionar mês"
            />
            <SelectionModal
                isOpen={isGenderModalOpen}
                onClose={() => setIsGenderModalOpen(false)}
                onSelect={(value) => { setGender(value); setIsGenderModalOpen(false); }}
                currentValue={gender}
                options={genders}
                title="Selecione seu gênero"
            />

        </div>
    );
};

export default BasicInfoScreen;