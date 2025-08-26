
import React from 'react';
import type { User } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

interface ConnectedAccountsScreenProps {
  user: User;
  onExit: () => void;
  onLogout: () => void;
}

const ConnectedAccountsScreen: React.FC<ConnectedAccountsScreenProps> = ({ user, onExit, onLogout }) => {
  return (
    <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
      <header className="p-4 flex items-center shrink-0 border-b border-gray-800 relative">
        <button onClick={onExit} className="p-2 -m-2 z-10"><ArrowLeftIcon className="w-6 h-6" /></button>
        <h1 className="font-bold text-lg absolute left-1/2 -translate-x-1/2">Contas Conectadas</h1>
        <div className="w-6 h-6"></div>
      </header>

      <main className="flex-grow p-6">
        <p className="text-sm text-gray-400 mb-4">Esta é a conta do Google que você usou para entrar no LiveGo. Você pode desconectar para entrar com outra conta.</p>

        <div className="bg-[#1c1c1e] p-4 rounded-lg">
          <div className="flex items-center gap-4">
            <img src={user.avatar_url} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
            <div>
              <p className="font-semibold text-white text-lg">Você</p>
              <p className="text-gray-400">{user.email}</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-4 shrink-0 mt-auto">
         <button 
            onClick={onLogout}
            className="w-full bg-[#2c2c2e] text-white font-bold py-3.5 rounded-xl text-lg transition-colors hover:bg-gray-700"
        >
          Desconectar
        </button>
      </footer>
    </div>
  );
};

export default ConnectedAccountsScreen;