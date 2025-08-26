import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { User, DiamondPackage, AppView, PurchaseOrder, WithdrawalTransaction, WithdrawalBalance } from '../types';
import { getDiamondPackages } from '../services/authService';
import * as liveStreamService from '../services/liveStreamService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import DiamondIcon from './icons/DiamondIcon';
import CoinIcon from './icons/CoinIcon';
import ReportIcon from './icons/ReportIcon';
import QuestionMarkIcon from './icons/QuestionMarkIcon';
import GoldCoinIcon from './icons/GoldCoinIcon';
import CrossIcon from './icons/CrossIcon';

interface DiamondPurchaseScreenProps {
  user: User;
  onExit: () => void;
  onPurchase: (updatedUser: User, order: PurchaseOrder) => void;
  onNavigate: (view: AppView) => void;
  onConfirmPurchase: (pkg: DiamondPackage) => void;
  isOverlay?: boolean;
  onUpdateUser: (user: User) => void;
  onNavigateToSetup: () => void;
  onWithdrawalComplete: (transaction: WithdrawalTransaction) => void;
  successMessage: string | null;
  clearSuccessMessage: () => void;
}

const EARNING_TO_BRL_RATE = 0.0115;
const WITHDRAWAL_FEE_RATE = 0.20;

const DiamondPurchaseScreen: React.FC<DiamondPurchaseScreenProps> = ({ 
    user, 
    onExit, 
    onPurchase, 
    onNavigate, 
    onConfirmPurchase, 
    isOverlay = false,
    onUpdateUser,
    onNavigateToSetup,
    onWithdrawalComplete,
    successMessage,
    clearSuccessMessage,
}) => {
  const [packages, setPackages] = useState<DiamondPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'diamonds' | 'earnings'>('diamonds');
  const [isEarningsTooltipVisible, setIsEarningsTooltipVisible] = useState(false);

  // Withdrawal State
  const [earningsToWithdraw, setEarningsToWithdraw] = useState('');
  const [balance, setBalance] = useState<WithdrawalBalance | null>(null);
  const [history, setHistory] = useState<WithdrawalTransaction[]>([]);
  const [isWithdrawalLoading, setIsWithdrawalLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        clearSuccessMessage();
      }, 5000); // Display for 5 seconds

      return () => clearTimeout(timer);
    }
  }, [successMessage, clearSuccessMessage]);

  useEffect(() => {
    if (activeTab === 'diamonds') {
        const fetchData = async () => {
          setIsLoading(true);
          const diamondPackages = await getDiamondPackages();
          setPackages(diamondPackages);
          setIsLoading(false);
        };
        fetchData();
    }
  }, [activeTab]);
  
  const fetchWithdrawalData = useCallback(async () => {
    setIsWithdrawalLoading(true);
    setError(null);
    try {
      const [balanceData, historyData] = await Promise.all([
        liveStreamService.getWithdrawalBalance(user.id),
        liveStreamService.getWithdrawalHistory(user.id)
      ]);
      setBalance(balanceData);
      setHistory(historyData);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os dados de saque.");
    } finally {
      setIsWithdrawalLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    if (activeTab === 'earnings') {
        fetchWithdrawalData();
    }
  }, [activeTab, fetchWithdrawalData]);

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
        onUpdateUser(updatedUser);
        onWithdrawalComplete(transaction);
        setEarningsToWithdraw('');
        fetchWithdrawalData(); // Refresh all data
    } catch (err) {
        const message = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
        setError(message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

  const renderEarningsTab = () => {
    if (isWithdrawalLoading) {
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
                Disponível para saque: {(balance.availableBalance || 0).toLocaleString('pt-BR')} Ganhos
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

        <div className="mt-8">
          <button 
              onClick={handleWithdraw}
              disabled={isSubmitting || numericEarnings <= 0 || !user.withdrawal_method}
              className="w-full bg-green-500 text-black font-bold py-4 rounded-full text-lg transition-colors hover:bg-green-400 disabled:bg-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
              {isSubmitting ? 'Processando...' : 'Confirmar Saque'}
          </button>
        </div>

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
                                <span className="font-semibold text-white">Saque de {(tx.earnings_withdrawn || 0).toLocaleString('pt-BR')} Ganhos</span>
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
  
  const content = (
    <div 
        className={`${isOverlay ? 'bg-[#121212] h-auto max-h-[60vh] w-full max-w-lg rounded-t-2xl animate-slide-up-fast' : 'bg-[#121212] h-full w-full'} text-white flex flex-col font-sans`}
        onClick={e => e.stopPropagation()}
    >
      <header className="px-4 pt-4 pb-2 flex flex-col items-center shrink-0">
        <div className="w-full flex items-center justify-between text-center">
            <button onClick={onExit} className="p-2">
                <ArrowLeftIcon className="w-6 h-6"/>
            </button>
             <div className="flex justify-center gap-8">
                <button onClick={() => setActiveTab('diamonds')} className="text-center">
                    <h1 className={`text-lg font-semibold ${activeTab === 'diamonds' ? 'text-white' : 'text-gray-500'}`}>Diamante</h1>
                    {activeTab === 'diamonds' && <div className="w-6 h-1 bg-white rounded-full mx-auto mt-1.5"></div>}
                </button>
                <button onClick={() => setActiveTab('earnings')} className="text-center">
                    <h1 className={`text-lg font-semibold ${activeTab === 'earnings' ? 'text-white' : 'text-gray-500'}`}>Ganhos</h1>
                    {activeTab === 'earnings' && <div className="w-6 h-1 bg-white rounded-full mx-auto mt-1.5"></div>}
                </button>
            </div>
             <button onClick={() => onNavigate('purchase-history')} className="p-2 text-gray-400">
                <ReportIcon className="w-6 h-6"/>
            </button>
        </div>
      </header>

       {successMessage && (
        <div className="relative mx-4 mt-2">
            <div className="bg-green-500/20 border border-green-500/30 text-green-300 text-sm font-medium p-3 rounded-lg flex justify-between items-center animate-fade-in-fast">
                <span>{successMessage}</span>
                <button onClick={clearSuccessMessage} className="p-1 -m-1">
                    <CrossIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
      )}

      <main className="flex-grow p-4 overflow-y-auto scrollbar-hide">
        <div className="border-b border-gray-800 pb-6 mb-6">
            <div className="grid grid-cols-2 divide-x divide-gray-800">
                <div className="text-center px-2">
                    <div className="flex justify-between items-center text-gray-300 mb-2">
                        <span className="text-sm">Diamantes</span>
                        <button onClick={() => onNavigate('purchase-history')} className="text-sm font-semibold">
                        &gt;
                        </button>
                    </div>
                    <div className="flex items-center justify-start gap-2 mt-1">
                        <DiamondIcon className="w-8 h-8"/>
                        <span className="text-2xl font-bold text-white">{(user.wallet_diamonds || 0).toLocaleString()}</span>
                    </div>
                </div>
                <div className="text-center px-2">
                     <div className="flex justify-between items-center text-gray-300 mb-2">
                        <div className="relative flex items-center gap-1.5">
                            <span className="text-sm">Ganhos</span>
                             <button
                                onMouseEnter={() => setIsEarningsTooltipVisible(true)}
                                onMouseLeave={() => setIsEarningsTooltipVisible(false)}
                                onClick={() => setIsEarningsTooltipVisible(p => !p)}
                                className="text-gray-500"
                            >
                                <QuestionMarkIcon className="w-4 h-4" />
                            </button>
                            {isEarningsTooltipVisible && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg z-10">
                                    Ganhos são recebidos de presentes em lives e podem ser sacados como dinheiro.
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-gray-800"></div>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setActiveTab('earnings')} className="text-sm font-semibold">
                        &gt;
                        </button>
                    </div>
                     <div className="flex items-center justify-start gap-2 mt-1">
                        <CoinIcon className="w-8 h-8"/>
                        <span className="text-2xl font-bold text-white">{(user.wallet_earnings || 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>

        {activeTab === 'diamonds' && (
             <>
                {isLoading ? (
                    <div className="text-center text-gray-400">Carregando pacotes...</div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {packages.map(pkg => (
                            <button
                                key={pkg.id}
                                onClick={() => onConfirmPurchase(pkg)}
                                className="border border-gray-800 p-4 rounded-xl flex flex-col items-center justify-center text-center hover:bg-gray-800/50 transition-colors relative"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <DiamondIcon className="w-5 h-5"/>
                                    <span className="text-lg font-bold text-white">{pkg.diamonds.toLocaleString()}</span>
                                </div>
                                <span className="text-sm text-gray-400 bg-gray-800/60 px-3 py-1 rounded-full">
                                    {pkg.currency} {pkg.price.toFixed(2).replace('.', ',')}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
             </>
        )}
        
        {activeTab === 'earnings' && renderEarningsTab()}
      </main>
    </div>
  );

  if (isOverlay) {
    return (
        <div 
            className="fixed inset-0 bg-transparent z-50 flex items-end justify-center"
            onClick={onExit}
        >
            {content}
        </div>
    );
  }

  return content;
};

export default DiamondPurchaseScreen;
