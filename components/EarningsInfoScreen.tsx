
import React from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

interface EarningsInfoScreenProps {
  onExit: () => void;
}

const EarningsInfoScreen: React.FC<EarningsInfoScreenProps> = ({ onExit }) => {
  return (
    <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
      <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-800">
        <button onClick={onExit}><ArrowLeftIcon className="w-6 h-6" /></button>
        <h1 className="font-bold text-lg">Informações de Ganhos</h1>
        <div className="w-6 h-6"></div>
      </header>
      <main className="flex-grow p-6 overflow-y-auto text-gray-300 leading-relaxed">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Nossa Política de Monetização</h2>
        
        <section className="mb-8">
            <h3 className="text-xl font-semibold text-green-400 mb-3">Conversão de Ganhos para Dinheiro</h3>
            <p>
                A conversão dos seus "Ganhos" acumulados na plataforma para Reais (BRL) é <strong>totalmente gratuita</strong>. Não há nenhuma taxa oculta neste processo. Seu saldo de Ganhos é convertido usando a taxa de câmbio atual da plataforma.
            </p>
        </section>

        <section>
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">Taxa de Saque</h3>
            <p className="mb-4">
                Quando você solicita um saque, uma taxa de serviço é aplicada para cobrir os custos operacionais e de processamento de pagamento. A divisão é transparente:
            </p>
            
            <div className="space-y-4">
                <div className="p-4 bg-green-900/50 rounded-lg border border-green-500/50">
                    <p className="font-bold text-lg text-green-300">80% para Você (Streamer)</p>
                    <p className="text-sm text-green-400/80">A maior parte do valor é sua! Acreditamos em recompensar nossos criadores de conteúdo.</p>
                </div>
                 <div className="p-4 bg-red-900/50 rounded-lg border border-red-500/50">
                    <p className="font-bold text-lg text-red-300">20% para a Plataforma</p>
                    <p className="text-sm text-red-400/80">Esta taxa nos ajuda a manter a plataforma segura, desenvolver novos recursos e oferecer suporte à comunidade.</p>
                </div>
            </div>

            <div className="mt-6">
                <p className="font-semibold text-white mb-2">Visualização da Divisão:</p>
                <div className="w-full h-8 flex rounded-full overflow-hidden bg-gray-700">
                    <div className="h-full bg-green-500 flex items-center justify-center text-black font-bold" style={{ width: '80%' }}>
                        80%
                    </div>
                    <div className="h-full bg-red-500 flex items-center justify-center text-white font-bold" style={{ width: '20%' }}>
                        20%
                    </div>
                </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-6 text-center">
                O valor final que você recebe já terá essa taxa descontada. Todos os cálculos são exibidos claramente na tela de saque antes de você confirmar.
            </p>
        </section>
      </main>
    </div>
  );
};

export default EarningsInfoScreen;
