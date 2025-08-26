
import React from 'react';
import GoogleIcon from './icons/GoogleIcon';

interface LoginScreenProps {
  onGoogleLogin: (accountId: number) => void;
  isLoading: boolean;
  error: string | null;
}

const mockAccounts = [
  { id: 10755083, name: 'Seu Perfil', email: 'livego@example.com', avatar: 'https://i.pravatar.cc/150?u=10755083' },
  { id: 1, name: 'Maria Silva', email: 'maria.silva@example.com', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: 2, name: 'João Souza', email: 'joao.souza@example.com', avatar: 'https://i.pravatar.cc/150?u=2' },
];

const LoginScreen: React.FC<LoginScreenProps> = ({ onGoogleLogin, isLoading, error }) => {
    
  return (
    <>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { 
          animation: fade-in-up 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
      <div className="h-full w-full bg-black text-white p-6 flex flex-col justify-between font-sans">
          <header className="flex-shrink-0 py-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <h1 className="text-3xl font-bold text-center">Escolha uma conta</h1>
              <p className="text-gray-400 text-center mt-2">para continuar no LiveGo</p>
          </header>

          <main className="flex-shrink-0 flex flex-col gap-4">
              {mockAccounts.map((account, index) => (
                  <button
                      key={account.id}
                      onClick={() => onGoogleLogin(account.id)}
                      disabled={isLoading}
                      className="flex items-center w-full p-3 rounded-lg bg-[#1c1c1e] hover:bg-[#2c2c2e] transition-colors disabled:opacity-50 animate-fade-in-up"
                      style={{ animationDelay: `${200 + index * 100}ms` }}
                  >
                      <img src={account.avatar} alt={account.name} className="w-10 h-10 rounded-full mr-4"/>
                      <div className="text-left">
                          <p className="font-semibold">{account.name}</p>
                          <p className="text-sm text-gray-400">{account.email}</p>
                      </div>
                  </button>
              ))}
              <button
                  onClick={() => onGoogleLogin(3)}
                  disabled={isLoading}
                  className="flex items-center w-full p-3 rounded-lg hover:bg-[#2c2c2e] transition-colors disabled:opacity-50 animate-fade-in-up"
                  style={{ animationDelay: `${200 + mockAccounts.length * 100}ms` }}
              >
                  <div className="w-10 h-10 rounded-full mr-4 bg-gray-700 flex items-center justify-center">
                      <GoogleIcon className="w-6 h-6"/>
                  </div>
                  <p className="font-semibold">Usar outra conta</p>
              </button>
          </main>
          
          <footer 
            className="flex-shrink-0 animate-fade-in-up" 
            style={{ animationDelay: `${300 + mockAccounts.length * 100}ms` }}
          >
              {error && <p className="text-red-400 text-center text-sm mb-4">{error}</p>}
              <p className="text-xs text-gray-500 text-center py-4">
                Para continuar, o Google compartilhará seu nome, endereço de e-mail e foto do perfil com o LiveGo. Consulte a <a href="#" className="text-blue-400">Política de Privacidade</a> e os <a href="#" className="text-blue-400">Termos de Serviço</a> do LiveGo.
              </p>
          </footer>
      </div>
    </>
  );
};

export default LoginScreen;