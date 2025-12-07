
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
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  // Verifica se o dispositivo está bloqueado ao carregar o componente
  useEffect(() => {
    const checkDeviceStatus = () => {
      if (typeof window !== 'undefined') {
        // Verifica se há um parâmetro 'blocked' na URL
        const urlParams = new URLSearchParams(window.location.search);
        const isBlockedParam = urlParams.get('blocked') === 'true';
        
        const blockedData = localStorage.getItem('device_blocked');
        if (blockedData) {
          try {
            const { reason } = JSON.parse(blockedData);
            setBlockReason(reason || 'Dispositivo bloqueado por violação dos termos de serviço');
            setIsBlocked(true);
            
            // Se veio do redirecionamento de bloqueio, exibe mensagem
            if (isBlockedParam) {
              setStatusMessage({ 
                text: 'Este dispositivo está bloqueado. Entre em contato com o suporte para mais informações.', 
                type: 'error' 
              });
            }
          } catch (e) {
            console.error('Erro ao verificar status do dispositivo:', e);
          }
        } else if (isBlockedParam) {
          // Se o parâmetro está presente mas não há bloqueio, remove o parâmetro
          const url = new URL(window.location.href);
          url.searchParams.delete('blocked');
          window.history.replaceState({}, '', url.toString());
        }
      }
    };
    
    checkDeviceStatus();
    
    // Limpa mensagens quando a view muda
    if (viewMode !== 'login') {
      setStatusMessage({ text: '', type: '' });
    }
  }, [viewMode]);

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked) {
      setStatusMessage({ 
        text: 'Este dispositivo está bloqueado. Entre em contato com o suporte para mais informações.', 
        type: 'error' 
      });
      return;
    }
    
    if (email && password) {
      onLogin();
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked) {
      setStatusMessage({ 
        text: 'Este dispositivo está bloqueado. Não é possível criar uma nova conta.', 
        type: 'error' 
      });
      return;
    }
    
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

  // Se o dispositivo estiver bloqueado, mostra apenas a mensagem de bloqueio
  if (isBlocked) {
    return (
      <div className="text-center p-6">
        <div className="text-red-500 text-5xl mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">Acesso Bloqueado</h1>
        <p className="text-gray-300 mb-6">
          {blockReason}
        </p>
        <p className="text-gray-400 text-sm mb-6">
          Se você acredita que isso é um erro, entre em contato com o suporte.
        </p>
        <button
          onClick={() => window.location.href = 'mailto:suporte@livego.com?subject=Dispositivo Bloqueado'}
          className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
        >
          Entrar em Contato com o Suporte
        </button>
      </div>
    );
  }

  const renderContent = () => {
    switch (viewMode) {
      case 'register':
        return (
          <form onSubmit={handleRegister} className="space-y-4">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('register.name')} required autoComplete="name" className="w-full bg-gray-700/80 text-white placeholder-gray-400 rounded-full py-2.5 px-6 text-base focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('common.email')} required autoComplete="email" className="w-full bg-gray-700/80 text-white placeholder-gray-400 rounded-full py-2.5 px-6 text-base focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('common.password')} required autoComplete="new-password" className="w-full bg-gray-700/80 text-white placeholder-gray-400 rounded-full py-2.5 px-6 text-base focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <button
              type="submit"
              className="btn-primary"
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.1)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.98)';
                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              {t('register.createButton')}
            </button>
          </form>
        );
      case 'login':
        return (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('common.email')} required autoComplete="email" className="w-full bg-gray-700/80 text-white placeholder-gray-400 rounded-full py-2.5 px-6 text-base focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('common.password')} required autoComplete="current-password" className="w-full bg-gray-700/80 text-white placeholder-gray-400 rounded-full py-2.5 px-6 text-base focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <div className="text-right -mt-2">
              <button type="button" onClick={() => setViewMode('forgotPassword')} className="text-sm text-[#8B5CF6] font-semibold hover:underline px-2 py-1">{t('login.forgotPassword')}</button>
            </div>
            <button
              type="submit"
              className="btn-primary"
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.1)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.98)';
                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              {t('login.loginButton')}
            </button>
          </form>
        );
      case 'forgotPassword':
        return (
          <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
            <h2 className="text-xl font-bold text-white">{t('forgotPassword.title')}</h2>
            <p className="text-sm text-gray-300 pb-2">{t('forgotPassword.instructions')}</p>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('common.email')} required autoComplete="email" className="w-full bg-gray-700/80 text-white placeholder-gray-400 rounded-full py-2.5 px-6 text-base focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <button 
              type="submit" 
              className="btn-primary"
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.1)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.98)';
                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              {t('forgotPassword.sendLinkButton')}
            </button>
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
            <button 
              type="submit" 
              className="btn-primary"
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.1)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.98)';
                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              {t('forgotPassword.saveButton')}
            </button>
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
                <button
                  onClick={onLogin}
                  style={{
                    backgroundColor: 'white',
                    color: 'rgba(0, 0, 0, 0.87)',
                    fontWeight: '500',
                    borderRadius: '9999px',
                    padding: '10px 24px',
                    border: '1px solid #E5E7EB',
                    cursor: 'pointer',
                    width: '100%',
                    fontSize: '15px',
                    lineHeight: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s, transform 0.1s',
                    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <GoogleIcon className="w-5 h-5 mr-3" />
                  {t('login.signInWithGoogle')}
                </button>
                <div className="flex justify-center mt-4">
                  <button
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#3B5998',
                      borderRadius: '9999px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s, transform 0.1s',
                      margin: '0 auto'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#344E86'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3B5998'}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <FacebookIcon className="w-6 h-6 text-white" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 text-center space-y-4 py-4 mt-auto">
          {(viewMode === 'login' || viewMode === 'register') && (
            <div className="w-full space-y-4">
              <p className="text-gray-400 text-sm">
                {viewMode === 'register' ? t('register.haveAccount') : t('login.noAccount')}
              </p>
              <button
                onClick={() => switchView(viewMode === 'register' ? 'login' : 'register')}
                className="btn-primary"
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.1)';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.98)';
                  e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
              >
                {viewMode === 'register' ? t('login.loginButton') : t('login.createOne')}
              </button>
            </div>
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
