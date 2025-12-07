import React, { useState } from 'react';
import { api } from '../services/api';
import { Wallet } from '../types';

interface WalletTestProps {
  onClose: () => void;
}

const WalletTest: React.FC<WalletTestProps> = ({ onClose }) => {
  const [walletId, setWalletId] = useState('');
  const [reason, setReason] = useState('Acesso não autorizado detectado');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBlockWallet = async () => {
    if (!walletId.trim()) {
      setError('ID da wallet é obrigatório');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.blockUnauthorizedAccess(walletId.trim());
      setResult(`Wallet bloqueada com sucesso: ${JSON.stringify(response.wallet, null, 2)}`);
    } catch (err: any) {
      setError(err.message || 'Erro ao bloquear wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-white mb-4">Testar Bloqueio de Wallet</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              ID da Wallet
            </label>
            <input
              type="text"
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite o ID da wallet..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Motivo do Bloqueio
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Motivo do bloqueio..."
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleBlockWallet}
              disabled={loading}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Bloqueando...' : 'Bloquear Wallet'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Fechar
            </button>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="bg-green-900/50 border border-green-500 text-green-200 px-3 py-2 rounded-md text-sm">
              <pre className="whitespace-pre-wrap">{result}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletTest;
