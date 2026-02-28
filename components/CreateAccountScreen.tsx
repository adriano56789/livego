import React, { useState } from 'react';
import { BackIcon, LiveGoLogo } from './icons';

interface CreateAccountScreenProps {
    onBack: () => void;
    onNext: () => void;
}

const FloatingLabelInput: React.FC<{
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ id, label, value, onChange }) => (
    <div className="relative">
        <input
            id={id}
            type="text"
            value={value}
            onChange={onChange}
            className="w-full px-3 py-3.5 text-base bg-transparent rounded border border-gray-500 focus:border-blue-400 outline-none peer transition-colors"
        />
        <label
            htmlFor={id}
            className={`absolute left-3 transition-all duration-200 ease-in-out pointer-events-none ${
                value
                ? 'top-[-10px] text-xs bg-black px-1 text-blue-400'
                : 'top-3.5 text-base text-gray-400'
            } peer-focus:top-[-10px] peer-focus:text-xs peer-focus:text-blue-400 peer-focus:bg-black peer-focus:px-1`}
        >
            {label}
        </label>
    </div>
);

const CreateAccountScreen: React.FC<CreateAccountScreenProps> = ({ onBack, onNext }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleNext = () => {
    if (firstName) {
      onNext();
    }
  };

  return (
    <div className="bg-black h-screen w-screen text-white flex flex-col p-6 font-sans">
      <div className="absolute top-4 left-4">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-300 hover:text-white">
              <BackIcon className="w-6 h-6" />
          </button>
      </div>

      <div className="flex-grow flex flex-col items-center pt-10">
        <div className="w-full max-w-sm text-left">
          {/* Header */}
          <div className="text-center mb-10">
            <LiveGoLogo className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-3xl text-white">Criar uma Conta do Google</h2>
          <p className="text-gray-300 mt-2 text-base">
            Insira seu nome
          </p>

          {/* Form */}
          <div className="mt-10 space-y-6">
            <FloatingLabelInput 
                id="firstName"
                label="Nome"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
            />
            <FloatingLabelInput 
                id="lastName"
                label="Sobrenome (opcional)"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end items-center flex-shrink-0 w-full max-w-sm mx-auto">
        <button
          onClick={handleNext}
          className="bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-md text-sm hover:opacity-90 transition-opacity"
        >
          Avançar
        </button>
      </div>
    </div>
  );
};

export default CreateAccountScreen;