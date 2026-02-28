
import React, { useState, useEffect } from 'react';
import { GoogleAccount } from '../types';
import { api } from '../services/api';
import { LiveGoLogo, UserPlusIcon } from './icons';
import { LoadingSpinner } from './Loading';

interface GoogleAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountSelect: (account: GoogleAccount) => void;
  onAddAccount: () => void;
}

const GoogleAccountModal: React.FC<GoogleAccountModalProps> = ({ isOpen, onClose, onAccountSelect, onAddAccount }) => {
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      api.getGoogleAccounts().then(data => {
        setAccounts(data || []);
        setIsLoading(false);
      }).catch(err => {
        console.error("Failed to load Google accounts:", err);
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  const getAvatarLetter = (name: string) => {
    if (!name) return '?';
    return name.trim().charAt(0).toUpperCase();
  };

  const getAvatarColor = (letter: string) => {
    const l = letter.toLowerCase();
    if (l === 'a') return 'bg-blue-500';
    if (l === 'r') return 'bg-slate-500';
    if (l === 'v') return 'bg-rose-800';
    if (['b', 'c', 'd'].includes(l)) return 'bg-purple-500';
    if (['e', 'f', 'g'].includes(l)) return 'bg-green-500';
    return 'bg-indigo-500';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-start pt-16 sm:pt-24 p-4 font-sans">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <LiveGoLogo className="w-24 h-auto mb-6" />
          <h2 className="text-2xl font-normal text-white mb-2">Escolha uma conta</h2>
          <p className="text-gray-300 text-base">para continuar no app LiveGo</p>
        </div>
        <div className="bg-transparent rounded-lg">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <LoadingSpinner />
            </div>
          ) : (
            <ul>
              {accounts.map(account => (
                <li key={account.id}>
                  <button 
                    onClick={() => onAccountSelect(account)} 
                    className="w-full flex items-center space-x-4 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className={`w-10 h-10 rounded-full ${getAvatarColor(getAvatarLetter(account.name))} flex items-center justify-center font-medium text-xl text-white flex-shrink-0`}>
                      {getAvatarLetter(account.name)}
                    </div>
                    <div>
                      <p className="font-normal text-base text-white">{account.name}</p>
                      <p className="text-sm text-gray-300">{account.email}</p>
                    </div>
                  </button>
                </li>
              ))}
              <li>
                <button 
                  onClick={onAddAccount}
                  className="w-full flex items-center space-x-4 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserPlusIcon className="w-6 h-6 text-gray-300" />
                  </div>
                  <div>
                    <p className="font-normal text-base text-white">Adicionar outra conta</p>
                  </div>
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleAccountModal;
