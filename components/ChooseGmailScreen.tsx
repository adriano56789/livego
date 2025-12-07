import React, { useState } from 'react';

interface ChooseGmailScreenProps {
    onBack: () => void;
    onNext: () => void;
}

const RadioOption: React.FC<{
    id: string;
    label: string;
    checked: boolean;
    onChange: () => void;
}> = ({ id, label, checked, onChange }) => (
    <label htmlFor={id} className="flex items-center space-x-4 py-3 cursor-pointer">
        <div className="relative flex items-center justify-center w-6 h-6 flex-shrink-0">
            <input
                id={id}
                type="radio"
                name="gmail-option"
                checked={checked}
                onChange={onChange}
                className="sr-only"
            />
            <div className={`w-5 h-5 rounded-full border-2 ${checked ? 'border-blue-400' : 'border-gray-500'}`}></div>
            {checked && <div className="absolute w-2.5 h-2.5 bg-blue-400 rounded-full"></div>}
        </div>
        <span className="text-base text-gray-200">{label}</span>
    </label>
);

const ChooseGmailScreen: React.FC<ChooseGmailScreenProps> = ({ onBack, onNext }) => {
    const [selectedOption, setSelectedOption] = useState('santosspadriano61@gmail.com');
    const [customEmail, setCustomEmail] = useState('');

    const suggestions = [
        'santosspadriano61@gmail.com',
        'asantossp721@gmail.com',
    ];

    const isNextDisabled = selectedOption === 'create_own' && !customEmail.trim();

    return (
        <div className="bg-black h-screen w-screen text-white flex flex-col px-8 pt-16 pb-8 font-sans">
            <div className="flex-grow flex flex-col">
                <div className="w-full max-w-md mx-auto">
                    <h1 className="text-2xl mb-8">Google</h1>
                    
                    <h2 className="text-3xl text-white mb-2">Escolha seu endereço do Gmail</h2>
                    <p className="text-gray-400 text-base mb-8">
                        Escolha um endereço do Gmail ou crie seu próprio endereço
                    </p>

                    <div className="space-y-2 border-t border-b border-gray-800">
                        {suggestions.map(email => (
                            <RadioOption
                                key={email}
                                id={email}
                                label={email}
                                checked={selectedOption === email}
                                onChange={() => setSelectedOption(email)}
                            />
                        ))}
                         <RadioOption
                            id="create_own"
                            label="Crie seu próprio endereço do Gmail"
                            checked={selectedOption === 'create_own'}
                            onChange={() => setSelectedOption('create_own')}
                        />
                    </div>
                    
                    {selectedOption === 'create_own' && (
                        <div className="mt-6 relative">
                             <input
                                type="text"
                                value={customEmail}
                                onChange={(e) => setCustomEmail(e.target.value)}
                                className="w-full px-4 py-3.5 bg-transparent rounded border border-gray-600 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-colors text-base pr-24"
                                placeholder="Criar endereço"
                                autoFocus
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">@gmail.com</span>
                        </div>
                    )}

                    <button className="block text-blue-400 font-semibold mt-8 text-sm hover:underline p-1 -ml-1">
                        Usar celular
                    </button>
                </div>
            </div>

            <div className="flex justify-end items-center flex-shrink-0 w-full max-w-md mx-auto">
                <button
                    onClick={onNext}
                    disabled={isNextDisabled}
                    className="bg-[#8ab4f8] text-black font-semibold px-6 py-2.5 rounded text-sm hover:opacity-90 transition-opacity disabled:bg-[#3c4043] disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                    Avançar
                </button>
            </div>
        </div>
    );
};

export default ChooseGmailScreen;
