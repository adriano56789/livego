
import React, { useState } from 'react';
import type { User } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import PixIcon from './icons/PixIcon';
import MercadoPagoIcon from './icons/MercadoPagoIcon';
import CheckIcon from './icons/CheckIcon';

interface WithdrawalMethodSetupScreenProps {
  user: User;
  onExit: () => void;
  onSetupComplete: (user: User) => void;
}

const WithdrawalMethodSetupScreen: React.FC<WithdrawalMethodSetupScreenProps> = ({ user, onExit, onSetupComplete }) => {
  const [method, setMethod] = useState<'pix' | 'mercado_pago'>(user.withdrawal_method?.method || 'pix');
  const [account, setAccount] = useState(user.withdrawal_method?.account || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!account.trim()) {
      setError(`Por favor, insira ${method === 'pix' ? 'sua chave PIX' : 'seu e-mail do Mercado Pago'}.`);
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const updatedUser = await liveStreamService.saveWithdrawalMethod(user.id, method, account);
      onSetupComplete(updatedUser);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ocorreu um erro.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlaceholder = () => {
    if (method === 'pix') return 'CPF, e-mail ou telefone';
    return 'E-mail da conta Mercado Pago';
  };

  return (
    <div className="h-screen w-full bg-[#121212] text-white flex flex-col font-sans">
      <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-800">
        <button onClick={onExit}><ArrowLeftIcon className="w-6 h-6" /></button>
        <h1 className="font-bold text-lg">Configurar Método de Saque</h1>
        <div className="w-6 h-6"></div>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        <p className="text-gray-400 mb-4">Selecione como você gostaria de receber seu dinheiro.</p>
        
        <div className="flex gap-4 mb-6">
          <button onClick={() => setMethod('pix')} className={`relative flex-1 p-4 rounded-lg border-2 transition-colors ${method === 'pix' ? 'border-green-500 bg-green-500/10' : 'border-gray-700 bg-[#1c1c1c]'}`}>
            <PixIcon className="w-16 h-auto mx-auto" />
            <p className="font-semibold mt-2">PIX</p>
            {method === 'pix' && <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><CheckIcon className="w-3 h-3 text-black" /></div>}
          </button>
          <button onClick={() => setMethod('mercado_pago')} className={`relative flex-1 p-4 rounded-lg border-2 transition-colors ${method === 'mercado_pago' ? 'border-green-500 bg-green-500/10' : 'border-gray-700 bg-[#1c1c1c]'}`}>
            <MercadoPagoIcon className="w-16 h-auto mx-auto" />
            <p className="font-semibold mt-2">Mercado Pago</p>
            {method === 'mercado_pago' && <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><CheckIcon className="w-3 h-3 text-black" /></div>}
          </button>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">{method === 'pix' ? 'Chave PIX' : 'E-mail'}</label>
            <input
                type={method === 'mercado_pago' ? 'email' : 'text'}
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder={getPlaceholder()}
                className="w-full bg-[#2c2c2e] h-12 rounded-md px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
        </div>

        {error && <p className="text-red-400 text-center text-sm mt-4">{error}</p>}
      </main>

      <footer className="p-4 shrink-0">
         <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-green-500 text-black font-bold py-4 rounded-full text-lg transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-wait"
        >
            {isSubmitting ? 'Salvando...' : 'Salvar'}
        </button>
      </footer>
    </div>
  );
};

export default WithdrawalMethodSetupScreen;
