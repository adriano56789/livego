import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { User, WithdrawalTransaction, WithdrawalBalance } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import { useApiViewer } from './ApiContext';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import GoldCoinIcon from './icons/GoldCoinIcon';
import ReportIcon from './icons/ReportIcon';

const EARNING_TO_BRL_RATE = 0.0115;
const WITHDRAWAL_FEE_RATE = 0.20;

interface WithdrawalScreenProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onExit: () => void;
  onNavigateToSetup: () => void;
  onWithdrawalComplete: (transaction: WithdrawalTransaction) => void;
}

const WithdrawalScreen: React.FC<WithdrawalScreenProps> = ({ user, onUpdateUser, onExit, onNavigateToSetup, onWithdrawalComplete }) => {
  const [earningsToWithdraw, setEarningsToWithdraw] = useState('');
  const [balance, setBalance] = useState<WithdrawalBalance | null>(null);
  const [history, setHistory] = useState<WithdrawalTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showApiResponse } = useApiViewer();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [balanceData, historyData] = await Promise.all([
        liveStreamService.getWithdrawalBalance(user.id),
        liveStreamService.getWithdrawalHistory(user.id)
      ]);
      showApiResponse(`GET /api/withdrawals/balance/${user.id}`, balanceData);
      showApiResponse(`GET /api/users/${user.id}/withdrawal-history`, historyData);
      setBalance(balanceData);
      setHistory(historyData);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os dados de saque.");
    } finally {
      setIsLoading(false);
    }
  }, [user.id, showApiResponse]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const numericEarnings = useMemo(() => {
    const value = parseInt(earningsToWithdraw, 10);
    return isNaN(value) ? 0 : value;
  }, [earningsToWithdraw]);

  const calculations = useMemo(() => {
    const grossBRL = numericEarnings * EARNING_TO_BRL_RATE;
    const feeBRL = grossBRL * WITHDRAWAL_FEE_RATE;
    const netBRL = grossBRL - feeBRL;
    return { grossBRL, feeBRL, netBRL };
  }, [numericEarnings]);
  
  const handleWithdraw = async () => {
    setError(null);
    if (!user.withdrawal_method) {
        setError("Por favor, configure um método de saque primeiro.");
        return;
    }
    if(numericEarnings <= 0) {
        setError("Por favor, insira uma quantidade de ganhos válida.");
        return;
    }
    if(!balance || numericEarnings > balance.availableBalance) {
        setError("Você não tem ganhos suficientes para este saque.");
        return;
    }
    setIsSubmitting(true);
    try {
        const { updatedUser, transaction } = await liveStreamService.initiateWithdrawal(user.id, numericEarnings);
        showApiResponse(`POST /api/withdrawals/initiate`, { earningsToWithdraw: numericEarnings, success: true, transaction });
        onUpdateUser(updatedUser);
        onWithdrawalComplete(transaction);
        setEarningsToWithdraw('');
        fetchData(); // Refresh all data
    } catch (err) {
        const message = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
        setError(message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;
  
  const renderContent = () => {
    if (isLoading) {
      return <div className="flex-grow flex items-center justify-center"><div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div></div>;
    }
    if (error && !balance) {
      return <div className="flex-grow flex items-center justify-center text-red-400 p-4 text-center">{error}</div>;
    }
    if (!balance) {
      return <div className="flex-grow flex items-center justify-center text-gray-400">Nenhum dado de saldo encontrado.</div>;
    }

    return (
      <>
        <div className="py-4 border-b border-gray-800">
          <p className="text-sm text-gray-400">Seu saldo de Ganhos</p>
          <div className="flex items-center gap-3 mt-2">
            <GoldCoinIcon className="w-10 h-10" />
            <p className="text-4xl font-bold">{balance.availableBalance.toLocaleString('pt-BR')}</p>
          </div>
        </div>

        <section className="py-6 border-b border-gray-800">
            <h2 className="text-lg font-semibold mb-4">Valor do Saque</h2>
            <div className="relative mb-2">
                <input
                    type="number"
                    value={earningsToWithdraw}
                    onChange={(e) => setEarningsToWithdraw(e.target.value)}
                    placeholder="Quantidade de ganhos"
                    className="w-full bg-[#2c2c2e] h-14 rounded-md pl-4 pr-24 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                 <button 
                    onClick={() => setEarningsToWithdraw(String(balance.availableBalance))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#3A3A3C] text-white font-semibold px-4 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm"
                >
                    MAX
                </button>
            </div>
             <p className="text-xs text-gray-500 mb-4">
                Disponível para saque: {balance.availableBalance.toLocaleString('pt-BR')} Ganhos
            </p>
            
            <div className="space-y-2 text-sm pt-4 mt-4 border-t border-gray-800">
                <div className="flex justify-between text-gray-400"><span>Valor Bruto (BRL):</span> <span>{formatCurrency(calculations.grossBRL)}</span></div>
                <div className="flex justify-between text-gray-400"><span>Taxa da Plataforma (20%):</span> <span className="text-red-400">-{formatCurrency(calculations.feeBRL)}</span></div>
                <div className="flex justify-between font-bold text-base"><span className="text-white">Valor a Receber:</span> <span className="text-green-400">{formatCurrency(calculations.netBRL)}</span></div>
            </div>
        </section>

        <section className="py-6 border-b border-gray-800">
            <h2 className="text-lg font-semibold mb-3">Método de Saque</h2>
             <button 
                onClick={onNavigateToSetup}
                className="bg-[#2c2c2e] p-3 rounded-md flex justify-between items-center w-full text-left hover:bg-[#3a3a3c] transition-colors"
            >
                {user.withdrawal_method ? (
                    <div>
                        <span className="font-semibold uppercase">{user.withdrawal_method.method.replace('_', ' ')}</span>
                        <p className="text-sm text-gray-400">{user.withdrawal_method.account}</p>
                    </div>
                ) : (
                    <span className="font-semibold text-gray-300">Configurar Método</span>
                )}
                <span className="text-gray-400 text-lg">&gt;</span>
            </button>
             <p className="text-xs text-gray-500 mt-2">O valor será enviado para sua conta cadastrada.</p>
        </section>

        {error && <p className="text-red-400 text-center my-4">{error}</p>}

        <button 
            onClick={handleWithdraw}
            disabled={isSubmitting || numericEarnings <= 0 || !user.withdrawal_method}
            className="w-full mt-8 bg-[#2D3748] text-gray-200 font-bold py-4 rounded-full text-lg transition-colors hover:bg-[#4A5568] disabled:bg-[#2D3748] disabled:text-gray-500 disabled:cursor-not-allowed"
        >
            {isSubmitting ? 'Processando...' : 'Confirmar Saque'}
        </button>

        <section className="mt-8">
            <div className="flex items-center gap-2 mb-3">
                 <ReportIcon className="w-5 h-5 text-gray-400"/>
                 <h2 className="text-lg font-semibold text-gray-300">Histórico de Saques</h2>
            </div>
            {history.length > 0 ? (
                <div className="space-y-0">
                    {history.map(tx => (
                        <div key={tx.id} className="py-3 border-b border-gray-800 last:border-b-0 text-sm">
                            <div className="flex justify-between">
                                <span className="font-semibold text-white">Saque de {tx.earnings_withdrawn.toLocaleString('pt-BR')} Ganhos</span>
                                <span className="font-bold text-green-400">{formatCurrency(tx.net_amount_brl)}</span>
                            </div>
                            <div className="flex justify-between text-gray-400 mt-1">
                                <span>{new Date(tx.timestamp).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                <span className={`capitalize font-semibold ${
                                    tx.status === 'completed' ? 'text-green-500' :
                                    tx.status === 'pending' ? 'text-yellow-500' : 'text-red-400'
                                }`}>
                                    {
                                        tx.status === 'completed' ? 'Concluído' :
                                        tx.status === 'pending' ? 'Pendente' : 'Falhou'
                                    }
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-500">Nenhum saque realizado ainda.</p>
            )}
        </section>
      </>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#121212] text-white flex flex-col font-sans">
      <header className="p-4 flex items-center shrink-0">
        <button onClick={onExit} className="p-2 -m-2"><ArrowLeftIcon className="w-6 h-6" /></button>
        <h1 className="font-bold text-lg text-center flex-grow">Saque</h1>
        <div className="w-6 h-6"></div>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default WithdrawalScreen;
