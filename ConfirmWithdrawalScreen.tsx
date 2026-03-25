import React from 'react';
import { BackIcon, BankIcon, CreditCardIcon, YellowDiamondIcon } from './components/icons';
import { ToastType } from './types';
import { useTranslation } from './i18n';

interface ConfirmWithdrawalScreenProps {
  onClose: () => void;
  withdrawalDetails: {
    diamonds: number;
    gross_brl: number;
    platform_fee_brl: number;
    net_brl: number;
    method: string;
    methodDetails: string;
  };
  onConfirmWithdrawal: (details: {
    diamonds: number;
    gross_brl: number;
    platform_fee_brl: number;
    net_brl: number;
    method: string;
    methodDetails: string;
  }) => void;
  isProcessing: boolean;
  addToast: (type: ToastType, message: string) => void;
}

const ConfirmWithdrawalScreen: React.FC<ConfirmWithdrawalScreenProps> = ({ 
  onClose, 
  withdrawalDetails, 
  onConfirmWithdrawal, 
  isProcessing,
  addToast 
}) => {
  const { t } = useTranslation();

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

  return (
    <div className="absolute inset-0 bg-[#111111] z-50 flex flex-col text-white">
      <header className="flex items-center p-4 flex-shrink-0">
        <button onClick={onClose} className="absolute">
          <BackIcon className="w-6 h-6" />
        </button>
        <div className="flex-grow text-center">
          <h1 className="text-lg font-semibold">Confirmar Saque</h1>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto p-4 space-y-6 no-scrollbar">
        {/* Resumo do Saque */}
        <div className="bg-[#1c1c1e] rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-4">
                <YellowDiamondIcon className="w-8 h-8 text-yellow-400" />
                <div>
                    <p className="font-bold text-white">{withdrawalDetails.diamonds} Diamantes</p>
                    <p className="text-sm text-gray-400">Valor do saque</p>
                </div>
            </div>
            
            <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Valor Bruto (BRL)</span>
                    <span className="text-white font-semibold">{formatCurrency(withdrawalDetails.gross_brl)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Taxa da Plataforma (20%)</span>
                    <span className="text-red-400 font-semibold">-{formatCurrency(withdrawalDetails.platform_fee_brl)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-3 border-t border-gray-700">
                    <span className="text-white">Valor a Receber</span>
                    <span className="text-green-500">{formatCurrency(withdrawalDetails.net_brl)}</span>
                </div>
            </div>
        </div>

        {/* Método de Saque */}
        <div className="bg-[#1c1c1e] rounded-lg p-4">
            <h3 className="font-bold text-white mb-4">Método de Saque</h3>
            <div className="flex items-center space-x-3">
                {withdrawalDetails.method.toLowerCase() === 'pix' ? (
                    <>
                        <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-lg">PIX</span>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-white">PIX</p>
                            <p className="text-sm text-gray-400">Transferência Instantânea</p>
                        </div>
                    </>
                ) : (
                    <>
                        <BankIcon className="w-12 h-12 text-blue-400 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-semibold text-white">{withdrawalDetails.method.toUpperCase()}</p>
                            <p className="text-sm text-gray-400">Transferência Bancária</p>
                        </div>
                    </>
                )}
            </div>
            <div className="mt-4 p-3 bg-[#2c2c2e] rounded-md">
                <p className="text-sm text-gray-300 mb-1">Dados para recebimento:</p>
                <p className="text-white font-medium break-all">{withdrawalDetails.methodDetails}</p>
            </div>
        </div>

        {/* Informações Importantes */}
        <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4">
            <div className="flex items-start space-x-2">
                <div className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-yellow-400 mb-2">Informações Importantes</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                        <li>• O saque é instantâneo — o valor será creditado em sua conta assim que confirmado</li>
                        <li>• Taxas de processamento já foram deduzidas</li>
                        <li>• Após confirmado, não será possível cancelar</li>
                    </ul>
                </div>
            </div>
        </div>

        {/* Termos */}
        <div className="bg-[#1c1c1e] rounded-lg p-4">
            <p className="text-xs text-gray-400 leading-relaxed">
                Ao confirmar este saque, você declara estar ciente e concordar com os termos e condições de saque da plataforma. 
                Os valores apresentados já incluem todas as taxas aplicáveis.
            </p>
        </div>
      </main>

      <footer className="p-4 flex-shrink-0 space-y-3">
        <button
          onClick={() => onConfirmWithdrawal(withdrawalDetails)}
          disabled={isProcessing}
          className="w-full bg-green-600 text-white font-bold py-4 rounded-full hover:bg-green-700 transition-colors disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {isProcessing ? "Processando..." : `Confirmar Saque - ${formatCurrency(withdrawalDetails.net_brl)}`}
        </button>
        
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="w-full bg-gray-600 text-white font-bold py-3 rounded-full hover:bg-gray-700 transition-colors disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
      </footer>
    </div>
  );
};

export default ConfirmWithdrawalScreen;
