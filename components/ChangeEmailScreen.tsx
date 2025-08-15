import React, { useState } from 'react';
import type { User } from '../types';
import * as authService from '../services/authService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { useApiViewer } from './ApiContext';

interface ChangeEmailScreenProps {
  user: User;
  onExit: () => void;
  onEmailChanged: (updatedUser: User) => void;
}

const ChangeEmailScreen: React.FC<ChangeEmailScreenProps> = ({ user, onExit, onEmailChanged }) => {
  const [newEmail, setNewEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { showApiResponse } = useApiViewer();

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    if (!newEmail.trim()) {
      setError('Por favor, insira o novo e-mail.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const updatedUser = await authService.changeUserEmail(user.id, newEmail);
      showApiResponse(`PATCH /api/users/${user.id}/email`, { newEmail, success: true });
      onEmailChanged(updatedUser);
      setSuccess('Seu e-mail foi alterado com sucesso! Use o novo e-mail para o próximo login.');
      setNewEmail('');
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
      <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-800">
        <button onClick={onExit}><ArrowLeftIcon className="w-6 h-6" /></button>
        <h1 className="font-bold text-lg">Trocar E-mail</h1>
        <div className="w-6 h-6"></div>
      </header>

      <main className="flex-grow p-6 overflow-y-auto">
        <div className="bg-[#1c1c1c] p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-400">E-mail Atual</p>
          <p className="font-semibold text-white mt-1">{user.email}</p>
        </div>

        <div>
          <label htmlFor="new-email" className="block text-sm font-medium text-gray-300 mb-2">Novo E-mail</label>
          <input
            id="new-email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Digite o novo endereço de e-mail"
            className="w-full bg-[#2c2c2e] h-12 rounded-md px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        {error && <p className="text-red-400 text-center text-sm mt-4">{error}</p>}
        {success && <p className="text-green-400 text-center text-sm mt-4">{success}</p>}

      </main>

      <footer className="p-4 shrink-0">
         <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !newEmail.trim()}
            className="w-full bg-green-500 text-black font-bold py-4 rounded-full text-lg transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-wait"
        >
            {isSubmitting ? 'Salvando...' : 'Confirmar Alteração'}
        </button>
      </footer>
    </div>
  );
};

export default ChangeEmailScreen;
