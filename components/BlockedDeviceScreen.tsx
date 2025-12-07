import React, { useEffect } from 'react';
import { clearDeviceBlock } from '../src/utils/deviceSecurity';

const BlockedDeviceScreen: React.FC = () => {
  useEffect(() => {
    // Tenta limpar o bloqueio ao carregar a página (para desenvolvimento)
    // Em produção, você pode remover ou proteger isso atrás de uma autenticação de administrador
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev && typeof window !== 'undefined' && window.location.search.includes('unblock')) {
      clearDeviceBlock();
      window.location.href = '/';
    }
  }, []);

  const handleContactSupport = () => {
    // Implemente a lógica para contatar o suporte
    window.location.href = 'mailto:suporte@livego.com?subject=Dispositivo Bloqueado';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="text-red-500 text-6xl mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Dispositivo Bloqueado</h1>
        <p className="text-gray-600 mb-6">
          Este dispositivo foi bloqueado por motivos de segurança. Se você acredita que isso é um erro, entre em contato com o suporte.
        </p>
        <div className="space-y-3">
          <button
            onClick={handleContactSupport}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Entrar em Contato com o Suporte
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
          >
            Tentar Novamente
          </button>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
          >
            Voltar para o Login
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
            <p className="text-sm">
              <strong>Modo Desenvolvimento:</strong> Para desbloquear o dispositivo, adicione <code>?unblock</code> à URL e recarregue a página.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockedDeviceScreen;
