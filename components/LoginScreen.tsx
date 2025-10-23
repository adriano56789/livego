import React from 'react';
import { GoogleIcon, FacebookIcon } from './icons';
import { useTranslation } from '../i18n';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 bg-[#111111]">
      <div className="flex-grow flex flex-col items-center justify-center">
        <h1 className="text-5xl font-bold text-white tracking-wider">LiveGo</h1>
        <p className="text-gray-400 mt-2 text-lg">{t('login.subtitle')}</p>
      </div>

      <div className="w-full max-w-xs space-y-6 pb-16">
        <button
          onClick={onLogin}
          className="w-full bg-white text-black font-semibold rounded-full py-3 px-6 flex items-center justify-center text-lg shadow-lg hover:bg-gray-200 transition-colors"
        >
          <GoogleIcon className="w-6 h-6 mr-3" />
          {t('login.signInWithGoogle')}
        </button>
        
        <p className="text-gray-400 text-sm">{t('login.moreOptions')}</p>
        
        <button className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto hover:bg-gray-600 transition-colors">
          <FacebookIcon className="w-6 h-6 text-white" />
        </button>
      </div>
      
      <div className="pb-8 text-xs text-gray-500">
        <p>{t('login.terms')}</p>
        <p>
          <a href="#" className="underline">{t('login.userAgreement')}</a> e a <a href="#" className="underline">{t('login.privacyPolicy')}</a>.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
