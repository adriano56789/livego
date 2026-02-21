
import React from 'react';
import { BackIcon, ShareIcon, CheckCircleIcon, PixIcon, CreditCardIcon, CopyIcon, DownloadIcon } from './icons';

interface PaymentSuccessScreenProps {
  onClose: () => void;
  data: {
    price: number;
    diamonds: number;
    method?: 'pix' | 'credit_card';
    transactionId?: string;
    timestamp?: Date;
  };
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const PaymentSuccessScreen: React.FC<PaymentSuccessScreenProps> = ({ onClose, data, addToast }) => {
  const transactionId = data.transactionId || `#${Math.floor(Math.random() * 100000000)}`;
  const date = data.timestamp || new Date();
  const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const handleCopyId = () => {
    navigator.clipboard.writeText(transactionId);
    addToast('success', 'ID copiado!');
  };

  const handleDownload = () => {
    addToast('success', 'Comprovante salvo na galeria!');
  };

  return (
    <div className="absolute inset-0 bg-[#111111] z-50 flex flex-col text-white font-sans animate-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between p-4 flex-shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <BackIcon className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-lg font-bold">Comprovante</h1>
        <button className="p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors">
          <ShareIcon className="w-6 h-6 text-white" />
        </button>
      </header>

      <main className="flex-grow flex flex-col items-center px-6 pt-6 overflow-y-auto no-scrollbar">
        
        {/* Success Icon & Message */}
        <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-4 relative">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                    <CheckCircleIcon className="w-10 h-10 text-black" strokeWidth={2.5} />
                </div>
            </div>
            <h2 className="text-2xl font-bold mb-1">Pagamento Realizado!</h2>
            <p className="text-gray-400 text-sm">Sua transação foi processada com sucesso.</p>
        </div>

        {/* Receipt Card */}
        <div className="w-full bg-[#1E1E1E] rounded-2xl p-6 space-y-6 border border-white/5 shadow-lg">
            
            {/* Value */}
            <div className="text-center pb-6 border-b border-gray-700/50">
                <p className="text-gray-400 text-xs mb-1 uppercase tracking-wide">Valor Total</p>
                <p className="text-4xl font-bold text-white">R$ {data.price.toFixed(2).replace('.', ',')}</p>
            </div>

            {/* Details Grid */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Beneficiário</span>
                    <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold">LG</div>
                        <span className="text-white font-medium text-sm">LiveGo Inc.</span>
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Método</span>
                    <div className="flex items-center space-x-2">
                        {data.method === 'credit_card' ? (
                            <>
                                <CreditCardIcon className="w-4 h-4 text-blue-400" />
                                <span className="text-white font-medium text-sm">Crédito</span>
                            </>
                        ) : (
                            <>
                                <PixIcon className="w-4 h-4 text-[#32BCAD]" />
                                <span className="text-white font-medium text-sm">Pix</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Data/Hora</span>
                    <span className="text-white font-medium text-sm">{formattedDate}, {formattedTime}</span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">ID da Transação</span>
                    <div className="flex items-center space-x-2">
                        <span className="text-white font-medium text-sm font-mono tracking-tight">{transactionId}</span>
                        <button onClick={handleCopyId} className="text-blue-500 hover:text-blue-400">
                            <CopyIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

      </main>

      {/* Footer Buttons */}
      <footer className="p-6 space-y-3 bg-[#111111]">
        <button 
            onClick={handleDownload}
            className="w-full bg-[#1a56db] hover:bg-[#1e40af] text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-colors active:scale-[0.98]"
        >
            <DownloadIcon className="w-5 h-5" />
            <span>Baixar Comprovante</span>
        </button>
        <button 
            onClick={onClose}
            className="w-full bg-[#1E1E1E] hover:bg-[#2a2a2c] text-white border border-white/10 font-bold py-4 rounded-xl transition-colors active:scale-[0.98]"
        >
            Voltar para o Início
        </button>
      </footer>
    </div>
  );
};

export default PaymentSuccessScreen;
