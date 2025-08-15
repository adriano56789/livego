
import React from 'react';
import GoogleIcon from './icons/GoogleIcon';
import FacebookIcon from './icons/FacebookIcon';
import { loginWithFacebook } from '../services/authService';

interface LoginScreenProps {
  onGoogleLogin: () => void;
  isLoading: boolean;
  error: string | null;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onGoogleLogin, isLoading, error }) => {
  const handleFacebookClick = () => {
    loginWithFacebook();
  };
    
  return (
    <div className="relative h-screen w-full bg-black flex items-end">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-50"
        style={{ backgroundImage: "url('https://picsum.photos/seed/livego-bg/800/1200')" }}
      ></div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>

      {/* Content */}
      <div className="relative z-10 w-full text-white p-6 pb-8 flex flex-col h-full">
        <div className="flex-grow flex flex-col justify-center items-center text-center -mt-16">
            <h1 className="font-black text-8xl tracking-tighter">
                LiveGo
            </h1>
            <p className="text-xl font-light text-gray-200 mt-2">
                Top Streamers, Boas Vibrações!
            </p>
        </div>

        <div className="w-full max-w-sm mx-auto flex flex-col gap-4">
           {error && <p className="text-red-400 text-center text-sm mb-2">{error}</p>}
           
           <button
            onClick={onGoogleLogin}
            disabled={isLoading}
            className="flex items-center justify-center w-full bg-white text-black font-semibold py-3.5 px-6 rounded-full text-base transition-opacity duration-300 hover:opacity-90 disabled:opacity-50 disabled:cursor-wait"
           >
            {isLoading ? (
                <span key="loading" className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Entrando...
                </span>
            ) : (
                <span key="default" className="flex items-center justify-center">
                    <GoogleIcon className="w-6 h-6 mr-3" />
                    Entrar com Google
                </span>
            )}
           </button>

           <div className="flex items-center my-4">
             <div className="flex-grow border-t border-gray-600"></div>
             <span className="flex-shrink mx-4 text-gray-400 text-sm">Mais opções de login</span>
             <div className="flex-grow border-t border-gray-600"></div>
           </div>

           <div className="flex justify-center gap-6">
                <button 
                  onClick={handleFacebookClick}
                  className="flex items-center justify-center w-14 h-14 bg-transparent border border-gray-500 rounded-full transition-colors duration-300 hover:bg-blue-600 hover:border-blue-600"
                  aria-label="Login with Facebook"
                >
                    <FacebookIcon className="w-7 h-7" />
                </button>
                {/* Placeholder for a removed icon, can be replaced later */}
                {/* <div className="w-14 h-14"></div> */}
           </div>
           
           <p className="text-xs text-gray-400 text-center mt-8">
            Login/registro significa que você leu e concordou com o <br/>
            <a href="#" className="underline hover:text-white">Contrato do Usuário</a> e a <a href="#" className="underline hover:text-white">Política de Privacidade</a>.
           </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;