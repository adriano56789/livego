import React, { useState } from 'react';
import { LiveGoLogo } from './icons';

interface AddAccountScreenProps {
  onBack: () => void;
  onLogin: () => void;
  onCreateAccount: () => void;
}

const AddAccountScreen: React.FC<AddAccountScreenProps> = ({ onBack, onLogin, onCreateAccount }) => {
  const [email, setEmail] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNext = () => {
    // In a real app, you would validate the email/phone and proceed to the password step.
    // For this simulation, we'll just log in if there's any input.
    if (email) {
      onLogin();
    }
  };
  
  const handleCreatePersonalAccount = () => {
    setIsMenuOpen(false);
    onCreateAccount();
  };

  return (
    <div className="bg-black h-screen w-screen text-white flex flex-col p-6 font-sans">
      <div className="flex-grow flex flex-col items-center pt-10">
        <div className="w-full max-w-sm text-left">
          {/* Header with LiveGo logo as requested */}
          <div className="text-center mb-10">
            <LiveGoLogo className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-3xl text-white">Fazer login</h2>
          <p className="text-gray-300 mt-4 text-base">
            Use sua Conta do Google. Ela será adicionada a este dispositivo e vai estar disponível para outros apps do Google.
          </p>
          <a href="#" className="block text-blue-400 font-semibold mt-2 text-sm hover:underline">
            Mais informações sobre como usar sua conta
          </a>

          {/* Form */}
          <div className="mt-10">
            <div className="relative">
              <input
                id="email-add-input"
                type="text" // Use text to allow phone numbers
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-3.5 text-base bg-transparent rounded border border-gray-500 focus:border-blue-400 outline-none peer transition-colors"
                autoFocus
              />
              <label
                htmlFor="email-add-input"
                className={`absolute left-3 transition-all duration-200 ease-in-out pointer-events-none ${
                  email
                    ? 'top-[-10px] text-xs bg-black px-1 text-blue-400'
                    : 'top-3.5 text-base text-gray-400'
                } peer-focus:top-[-10px] peer-focus:text-xs peer-focus:text-blue-400 peer-focus:bg-black peer-focus:px-1`}
              >
                E-mail ou telefone
              </label>
            </div>
            <button className="text-blue-400 font-semibold text-sm mt-1 hover:text-blue-300 self-start p-2 -ml-2 rounded">
              Esqueceu seu e-mail?
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center flex-shrink-0 w-full max-w-sm mx-auto">
        <div className="relative">
          {isMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-56 bg-[#3c3c3e] rounded-lg shadow-lg py-1">
              <button 
                onClick={handleCreatePersonalAccount}
                className="block w-full text-left px-4 py-3 hover:bg-white/10 rounded-t-lg text-sm text-gray-200"
              >
                Para uso pessoal
              </button>
              <button 
                onClick={handleCreatePersonalAccount} // For now, both go to same place
                className="block w-full text-left px-4 py-3 hover:bg-white/10 rounded-b-lg text-sm text-gray-200"
              >
                Para trabalho ou empresa
              </button>
            </div>
          )}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-blue-400 font-semibold text-sm hover:bg-blue-400/10 p-2 rounded"
          >
            Criar conta
          </button>
        </div>
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

export default AddAccountScreen;