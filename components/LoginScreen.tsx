
import React from 'react';
import GoogleIcon from './icons/GoogleIcon';
import FacebookIcon from './icons/FacebookIcon';

interface LoginScreenProps {
  onGoogleLogin: (accountId: number) => void;
  isLoading: boolean;
  error: string | null;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onGoogleLogin, isLoading, error }) => (
    <div 
        className="h-full w-full bg-black text-white p-4 sm:p-8 flex flex-col justify-between items-center font-sans"
        style={{
            backgroundImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(20,20,20,1) 60%, rgba(45,45,45,1) 100%)',
        }}
    >
        <div className="flex-grow flex flex-col justify-center items-center text-center -mt-8 sm:-mt-16">
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tighter" style={{ fontFamily: "'Helvetica Neue', sans-serif" }}>
                LiveGo
            </h1>
            <p className="text-gray-300 mt-2 text-lg">Top Streamers, Boas Vibrações!</p>
        </div>

        <div className="w-full max-w-sm flex flex-col items-center flex-shrink-0">
            {error && <p className="text-red-400 text-center text-sm mb-4">{error}</p>}
            <button
                onClick={() => onGoogleLogin(10755083)}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 p-3.5 rounded-full bg-white text-black font-semibold text-base hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
                {isLoading ? (
                    <svg className="animate-spin h-6 w-6 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <>
                        <GoogleIcon className="w-6 h-6" />
                        <span>Entrar com o Google</span>
                    </>
                )}
            </button>
            
            <div className="flex items-center w-full my-6">
                <div className="flex-grow border-t border-gray-600"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-sm">Mais opções de login</span>
                <div className="flex-grow border-t border-gray-600"></div>
            </div>
            
            <button 
                onClick={() => alert('Login com Facebook não implementado.')}
                className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
                aria-label="Entrar com o Facebook"
            >
                <FacebookIcon className="w-6 h-6 text-white"/>
            </button>

            <p className="text-xs text-gray-500 text-center mt-12">
                Login/registro significa que você leu e fornece o <a href="#" className="underline">Contrato do Usuário</a> e a <a href="#" className="underline">Política de Privacidade</a>.
            </p>
        </div>
    </div>
);

export default LoginScreen;