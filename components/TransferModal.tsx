import React, { useState } from 'react';
import { User, ToastType } from '../types';
import { api } from '../services/api';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  updateUser: (user: User) => void;
  addToast: (type: ToastType, message: string) => void;
}

const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  updateUser,
  addToast,
}) => {
  const [amount, setAmount] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState('');

  const handleTransfer = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Por favor, insira um valor válido.');
      return;
    }

    if (!recipientEmail || !/\S+@\S+\.\S+/.test(recipientEmail)) {
      setError('Por favor, insira um e-mail de destinatário válido.');
      return;
    }

    if (Number(amount) > (currentUser.platformEarnings || 0)) {
      setError('Saldo insuficiente para realizar a transferência.');
      return;
    }

    setIsTransferring(true);
    setError('');

    try {
      const { success, message, user } = await api.transferFunds({
        amount: Number(amount),
        recipientEmail,
      });

      if (success && user) {
        updateUser(user);
        addToast(ToastType.Success, message || 'Transferência realizada com sucesso!');
        onClose();
      } else {
        throw new Error(message || 'Falha ao realizar a transferência.');
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsTransferring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
      <div className="bg-[#1c1c1e] rounded-xl w-full max-w-md overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-white">Transferir Saldo</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Valor a transferir
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 sm:text-sm">R$</span>
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-[#2C2C2E] text-white w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0,00"
                  step="0.01"
                  min="0"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Saldo disponível: R$ {currentUser.platformEarnings?.toFixed(2).replace('.', ',') || '0,00'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                E-mail do destinatário
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="bg-[#2C2C2E] text-white w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="email@exemplo.com"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm mt-2">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={handleTransfer}
                disabled={isTransferring}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isTransferring ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>Transferir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferModal;
