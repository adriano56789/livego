
import React, { useState, useEffect } from 'react';
import { GoogleIcon, FacebookIcon } from './icons';
import { useTranslation } from '../i18n';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'register' | 'login' | 'forgotPassword' | 'resetPassword'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

  // Clear messages when view changes
  useEffect(() => {
    setStatusMessage({ text: '', type: '' });
  }, [viewMode]);

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin();
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && password) {
      setStatusMessage({ text: t('register.success'), type: 'success' });
      setViewMode('login');
      setName('');
      setPassword('');
    }
  };

  const handleForgotPasswordRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatusMessage({ text: t('forgotPassword.emailSent'), type: 'info' });
    setTimeout(() => {
        setStatusMessage({ text: '', type: '' });
        setViewMode('resetPassword');
    }, 2500);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
        setStatusMessage({ text: t('forgotPassword.passwordTooShort'), type: 'error' });
        return;
    }
    if (newPassword !== confirmNewPassword) {
        setStatusMessage({ text: t('forgotPassword.passwordMismatch'), type: 'error' });
        return;
    }
    setStatusMessage({ text: t('forgotPassword.resetSuccess'), type: 'success' });
    setViewMode('login');
    setPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const switchView = (targetView: 'login' | 'register') => {
      setViewMode(targetView);
      setName('');
      if (viewMode !== 'register' || targetView !== 'login') {
        setEmail('');
      }
      setPassword('');
  };

  const renderContent = () => {
    switch(viewMode) {
      case 'register':
        return (
          <form onSubmit={handleRegister} className="space-y-4">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('register.name')} required autoComplete="name" className="w-full bg-gray-700/80 text-white placeholder-gray-400 rounded-full py-2.5 px-6 text-base focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('common.email')} required autoComplete="email" className="w-full bg-gray-700/80 text-white placeholder-gray-400 rounded-full py-2.5 px-6 text-base focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('common.password')} required autoComplete="new-password" className="w-full bg-gray-700/80 text-white placeholder-gray-400 rounded-full py-2.5 px-6 text-base focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <button type="submit" className="w-full bg-purple-600 text-white font-semibold rounded-full py-2.5 px-6 text-base shadow-lg hover:bg-purple-700 transition-colors">{t('register.createButton')}</button>
          </form>
        );
      case 'login':
        return (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('common.email')} required autoComplete="email" className="w-full bg-gray-700/80 text-white placeholder-gray-400 rounded-full py-2.5 px-6 text-base focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('common.password')} required autoComplete="current-password" className="w-full bg-gray-700/80 text-white placeholder-gray-400 rounded-full py-2.5 px-6 text-base focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <div className="text-right -mt-2">
              <button type="button" onClick={() => setViewMode('forgotPassword')} className="text-sm text-purple-400 font-semibold hover:underline px-2 py-1">{t('login.forgotPassword')}</button>
            </div>
            <button type="submit" className="w-full bg-purple-600 text-white font-semibold rounded-full py-2.5 px-6 text-base shadow-lg hover:bg-purple-700 transition-colors">{t('login.loginButton')}</button>
          </form>
        );
      case 'forgotPassword':
        return (
            <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                <h2 className="text-xl font-bold text-white">{t('forgotPassword.title')}</h2>
                <p className="text-sm text-gray-300 pb-2">{t('forgotPassword.instructions')}</p>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('common.email')} required autoComplete="email" className="w-full bg-gray-700/80 text-white placeholder-gray-400 rounded-full py-2.5 px-6 text-base focus:outline-none focus:ring-2 focus:ring-purple-500" />
                <button type="submit" className="w-full bg-purple-600 text-white font-semibold rounded-full py-2.5 px-6 text-base shadow-lg hover:bg-purple-700 transition-colors">{t('forgotPassword.sendLinkButton')}</button>
                <button type="button" onClick={() => setViewMode('login')} className="text-sm text-purple-400 font-semibold hover:underline">{t('forgotPassword.backToLogin')}</button>
            </form>
        );
       case 'resetPassword':
        return (
            <form onSubmit={handleResetPassword} className="space-y-4">
                <h2 className="text-xl font-bold text-white">{t('forgotPassword.newPasswordTitle')}</h2>
                <p className="text-sm text-gray-300 pb-2">{t('forgotPassword.newPasswordInstructions')}</p>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('forgotPassword.newPasswordPlaceholder')} required autoComplete="new-password" className="w-full bg-gray-700/80 text-white placeholder-gray-400 rounded-full py-2.5 px-6 text-base focus:outline-none focus:ring-2 focus:ring-purple-500" />
                <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder={t('forgotPassword.confirmPasswordPlaceholder')} required autoComplete="new-password" className="w-full bg-gray-700/80 text-white placeholder-gray-400 rounded-full py-2.5 px-6 text-base focus:outline-none focus:ring-2 focus:ring-purple-500" />
                <button type="submit" className="w-full bg-purple-600 text-white font-semibold rounded-full py-2.5 px-6 text-base shadow-lg hover:bg-purple-700 transition-colors">{t('forgotPassword.saveButton')}</button>
            </form>
        );
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop')" }}>
      <div className="absolute inset-0 bg-black/70"></div>
      
      <div className="relative h-full w-full flex flex-col items-center p-8 sm:p-12 overflow-y-auto no-scrollbar" style={{ paddingTop: 'calc(2rem + var(--sat))', paddingBottom: 'calc(2rem + var(--sab))' }}>
        <div className="w-full max-w-sm mx-auto flex flex-col justify-center flex-grow">
          
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold text-white tracking-wider">LiveGo</h1>
            <p className="text-gray-300 mt-2 text-lg">{t('login.subtitle')}</p>
          </div>

          <div className="flex-grow-0">
            {statusMessage.text && (
                <div className={`p-3 rounded-md text-sm mb-4 ${statusMessage.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                    {statusMessage.text}
                </div>
            )}
            {renderContent()}

            {(viewMode === 'login' || viewMode === 'register') && (
                <>
                <div className="relative flex py-4 items-center">
                    <div className="flex-grow border-t border-gray-600"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-sm">{t('login.or')}</span>
                    <div className="flex-grow border-t border-gray-600"></div>
                </div>
                <button onClick={onLogin} className="w-full bg-white text-black font-semibold rounded-full py-2.5 px-6 flex items-center justify-center text-base shadow-lg hover:bg-gray-200 transition-colors">
                    <GoogleIcon className="w-6 h-6 mr-3" />
                    {t('login.signInWithGoogle')}
                </button>
                <div className="flex justify-center mt-4">
                    <button className="w-12 h-12 bg-gray-700/80 rounded-full flex items-center justify-center mx-auto hover:bg-gray-600/80 transition-colors">
                        <FacebookIcon className="w-6 h-6 text-white" />
                    </button>
                </div>
                </>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 text-center space-y-4 py-4 mt-auto">
            {(viewMode === 'login' || viewMode === 'register') && (
              <p className="text-gray-400 text-sm">
                {viewMode === 'register' ? t('register.haveAccount') : t('login.noAccount')}{' '}
                <button onClick={() => switchView(viewMode === 'register' ? 'login' : 'register')} className="text-purple-400 font-semibold hover:underline">
                  {viewMode === 'register' ? t('login.loginButton') : t('login.createOne')}
                </button>
              </p>
            )}
            <div className="text-xs text-gray-500">
                <p>{t('login.terms')}</p>
                <p>
                <a href="#" className="underline">{t('login.userAgreement')}</a> e a <a href="#" className="underline">{t('login.privacyPolicy')}</a>.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
