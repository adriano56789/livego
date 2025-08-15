
import React from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import HeadsetIcon from './icons/HeadsetIcon';
import EnvelopeIcon from './icons/EnvelopeIcon';
import WhatsAppIcon from './icons/WhatsAppIcon';
import HelpIcon from './icons/HelpIcon';

interface CustomerServiceScreenProps {
  onExit: () => void;
  onViewArticle: (articleId: string) => void;
  onViewSupportChat: () => void;
}

const ServiceButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center gap-2 p-4 bg-[#1c1c1c] rounded-xl hover:bg-[#2c2c2e] transition-colors">
    <div className="w-12 h-12 flex items-center justify-center bg-gray-700/50 rounded-full text-green-400">
      {icon}
    </div>
    <span className="font-semibold text-sm text-gray-200">{label}</span>
  </button>
);

const ArticleItem: React.FC<{ label: string; onClick: () => void; }> = ({ label, onClick }) => (
  <button onClick={onClick} className="w-full flex justify-between items-center p-4 bg-[#1c1c1c] rounded-lg hover:bg-[#2c2c2e] transition-colors">
    <span className="text-white">{label}</span>
    <span className="text-gray-500">&gt;</span>
  </button>
);

const CustomerServiceScreen: React.FC<CustomerServiceScreenProps> = ({ onExit, onViewArticle, onViewSupportChat }) => {
  const handleEmail = () => window.open('mailto:suporte@livego.com');
  const handleWhatsApp = () => window.open('https://wa.me/5511999999999', '_blank');

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
      <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-800">
        <button onClick={onExit}><ArrowLeftIcon className="w-6 h-6" /></button>
        <h1 className="font-bold text-lg">Atendimento ao Cliente</h1>
        <div className="w-6 h-6"></div>
      </header>
      <main className="flex-grow p-4 overflow-y-auto">
        <section className="text-center mb-8">
          <h2 className="text-xl font-semibold">Como podemos ajudar?</h2>
          <p className="text-gray-400 mt-2">Nossa equipe de suporte está pronta para te atender.</p>
        </section>

        <section className="mb-8">
          <h3 className="font-semibold text-gray-300 mb-3">Contato Direto</h3>
          <div className="grid grid-cols-3 gap-4">
            <ServiceButton icon={<HeadsetIcon className="w-7 h-7" />} label="Chat ao Vivo" onClick={onViewSupportChat} />
            <ServiceButton icon={<EnvelopeIcon className="w-7 h-7" />} label="Enviar E-mail" onClick={handleEmail} />
            <ServiceButton icon={<WhatsAppIcon className="w-7 h-7" />} label="WhatsApp" onClick={handleWhatsApp} />
          </div>
        </section>
        
        <section className="mb-8">
          <button onClick={() => onViewArticle('faq')} className="w-full flex justify-between items-center p-4 bg-green-800/50 rounded-lg hover:bg-green-700/50 transition-colors">
            <div className="flex items-center gap-3">
              <HelpIcon className="w-6 h-6 text-green-300"/>
              <span className="font-bold text-lg text-green-200">Perguntas Frequentes (FAQ)</span>
            </div>
            <span className="text-green-300 font-bold text-xl">&gt;</span>
          </button>
        </section>

        <section>
          <h3 className="font-semibold text-gray-300 mb-3">Artigos Úteis</h3>
          <div className="space-y-3">
            <ArticleItem label="Problemas com saque" onClick={() => onViewArticle('withdrawal-problems')} />
            <ArticleItem label="Como iniciar uma live?" onClick={() => onViewArticle('how-to-go-live')} />
            <ArticleItem label="Regras da comunidade" onClick={() => onViewArticle('community-rules')} />
            <ArticleItem label="Segurança da conta" onClick={() => onViewArticle('account-security')} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default CustomerServiceScreen;
