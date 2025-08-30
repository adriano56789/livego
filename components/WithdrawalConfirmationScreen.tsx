import React from 'react';
import type { WithdrawalTransaction } from '../types';
import SuccessIcon from './icons/SuccessIcon';

interface WithdrawalConfirmationScreenProps {
  transaction: WithdrawalTransaction | null;
  onExit: () => void;
}

const InfoRow: React.FC<{ label: string; value: string | React.ReactNode; isEmphasized?: boolean }> = ({ label, value, isEmphasized }) => (
    <div className={`flex justify-between items-center py-3 border-b border-gray-700/50 ${isEmphasized ? 'text-base' : 'text-sm'}`}>
        <span className="text-gray-400">{label}</span>
        <span className={`${isEmphasized ? 'font-bold text-white' : 'text-gray-200'}`}>{value}</span>
    </div>
);

const WithdrawalConfirmationScreen: React.FC<WithdrawalConfirmationScreenProps> = ({ transaction, onExit }) => {
  if (!transaction) {
    return (
      <div className="h-screen w-full bg-[#121212] text-white flex flex-col items-center justify-center p-4 font-sans">
        <h2 className="text-xl font-bold">Erro na Transação</h2>
        <p className="text-gray-400 mt-2">Os detalhes da transação não foram encontrados.</p>
        <button
          onClick={onExit}
          className="mt-8 w-full max-w-sm bg-green-500 text-black font-bold py-3 rounded-full text-lg"
        >
          Voltar
        </button>
      </div>
    );
  }
  
  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

  return (
    <div className="h-screen w-full bg-[#121212] text-white flex flex-col p-4 font-sans">
        <main className="flex-grow flex flex-col items-center justify-center text-center">
            <SuccessIcon className="w-20 h-20 mb-6" />
            <h1 className="text-2xl font-bold">Saque Solicitado com Sucesso!</h1>
            <p className="text-gray-400 mt-2 max-w-sm">O valor será enviado para sua conta cadastrada em breve.</p>

            <div className="w-full max-w-md bg-[#1c1c1c] rounded-lg p-4 mt-8 text-left">
                <InfoRow 
                    label="Valor Líquido Recebido" 
                    value={<span className="text-green-400">{formatCurrency(transaction.net_amount_brl)}</span>} 
                    isEmphasized 
                />
                <InfoRow 
                    label="Ganhos Sacados" 
                    value={(transaction.earnings_withdrawn || 0).toLocaleString('pt-BR')} 
                />
                <InfoRow 
                    label="Taxa da Plataforma" 
                    value={<span className="text-red-400">-{formatCurrency(transaction.fee_brl)}</span>} 
                />
                <InfoRow 
                    label="Método de Pagamento" 
                    value={
                        <div className="text-right">
                           <p className="font-semibold capitalize">{transaction.withdrawal_method.method.replace('_', ' ')}</p>
                           <p className="text-xs text-gray-500">{transaction.withdrawal_method.account}</p>
                        </div>
                    } 
                />
            </div>
        </main>
      <footer className="shrink-0 pb-4">
        <button
          onClick={onExit}
          className="w-full max-w-md mx-auto bg-green-500 text-black font-bold py-3 rounded-full text-lg"
        >
          Voltar para a Carteira
        </button>
      </footer>
    </div>
  );
};

export default WithdrawalConfirmationScreen;
