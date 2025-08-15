
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
      <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-800">
        <button onClick={onExit}><ArrowLeftIcon className="w-6 h-6" /></button>
        <h1 className="font-bold text-lg">Contas Conectadas</h1>
        <div className="w-6 h-6"></div>
      </header>

      <main className="flex-grow p-6 overflow-y-auto">
        <p className="text-sm text-gray-400 mb-4">Esta é a conta do Google que você usou para entrar no LiveGo. Você pode desconectar para entrar com outra conta.</p>

        <div className="bg-[#1c1c1c] p-4 rounded-lg">
          <div className="flex items-center gap-4">
            <img src={user.avatar_url} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
            <div>
              <p className="font-semibold text-white text-lg">{user.name}</p>
              <p className="text-gray-400">{user.email}</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-4 shrink-0">
         <button 
            onClick={onLogout}
            className="w-full bg-gray-600/50 text-white font-bold py-3 rounded-full text-lg transition-colors hover:bg-gray-600/80"
        >
          Desconectar
        </button>
      </footer>
    </div>
  );
};

export default ConnectedAccountsScreen;
