
import React from 'react';
import GoogleIcon from './icons/GoogleIcon';

interface LoginScreenProps {
  onGoogleLogin: () => void;
  isLoading: boolean;
  error: string | null;
}

const mockAccounts = [
  { name: 'Seu Perfil', email: 'livego@example.com', avatar: 'https://i.pravatar.cc/150?u=10755083' },
  { name: 'Maria Silva', email: 'maria.silva@example.com', avatar: 'https://i.pravatar.cc/150?u=1' },
  { name: 'João Souza', email: 'joao.souza@example.com', avatar: 'https://i.pravatar.cc/150?u=2' },
];

const LoginScreen: React.FC<LoginScreenProps> = ({ onGoogleLogin, isLoading, error }) => {
    
  return (
    <div className="h-screen w-full bg-black text-white p-6 flex flex-col font-sans">
        <header className="flex-shrink-0 py-4">
            <h1 className="text-3xl font-bold text-center">Escolha uma conta</h1>
            <p className="text-gray-400 text-center mt-2">para continuar no LiveGo</p>
        </header>

        <main className="flex-grow flex flex-col justify-center gap-4">
            {mockAccounts.map((account, index) => (
                <button
                    key={index}
                    onClick={onGoogleLogin}
                    disabled={isLoading}
                    className="flex items-center w-full p-3 rounded-lg bg-[#1c1c1e] hover:bg-[#2c2c2e] transition-colors disabled:opacity-50"
                >
                    <img src={account.avatar} alt={account.name} className="w-10 h-10 rounded-full mr-4"/>
                    <div className="text-left">
                        <p className="font-semibold">{account.name}</p>
                        <p className="text-sm text-gray-400">{account.email}</p>
                    </div>
                </button>
            ))}
             <button
                onClick={onGoogleLogin}
                disabled={isLoading}
                className="flex items-center w-full p-3 rounded-lg hover:bg-[#2c2c2e] transition-colors disabled:opacity-50"
            >
                <div className="w-10 h-10 rounded-full mr-4 bg-gray-700 flex items-center justify-center">
                    <GoogleIcon className="w-6 h-6"/>
                </div>
                <p className="font-semibold">Usar outra conta</p>
            </button>
        </main>
        
        {error && <p className="text-red-400 text-center text-sm mb-4">{error}</p>}

        <footer className="text-xs text-gray-500 text-center py-4">
            Para continuar, o Google compartilhará seu nome, endereço de e-mail e foto do perfil com o LiveGo. Consulte a <a href="#" className="text-blue-400">Política de Privacidade</a> e os <a href="#" className="text-blue-400">Termos de Serviço</a> do LiveGo.
        </footer>
    </div>
  );
};

export default LoginScreen;