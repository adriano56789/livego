
import React from 'react';
import CrossIcon from './icons/CrossIcon';

interface QuickChatModalProps {
    onClose: () => void;
    onSendMessage: (message: string) => void;
}

const quickMessages = [
    "Bem-vindo à minha live!",
    "Obrigado por seguir!",
    "Obrigado pelo presente!",
    "Como vocês estão?",
    "Não se esqueça de me seguir!",
    "Vamos para a batalha PK!",
    "Toque na tela para enviar curtidas!",
    "Amo todos vocês!",
];

const QuickChatModal: React.FC<QuickChatModalProps> = ({ onClose, onSendMessage }) => {
    
    const handleMessageClick = (message: string) => {
        onSendMessage(message);
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 z-50 flex items-end"
            onClick={onClose}
        >
            <div
                className="bg-[#212124]/95 backdrop-blur-md w-full rounded-t-2xl flex flex-col text-white animate-slide-up-fast max-h-[60vh]"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-white/10 flex items-center justify-center relative shrink-0">
                    <h2 className="font-bold text-lg">Mensagens Rápidas</h2>
                    <button onClick={onClose} className="absolute top-1/2 -translate-y-1/2 right-4">
                        <CrossIcon className="w-6 h-6 text-gray-400" />
                    </button>
                </header>
                <main className="p-4 overflow-y-auto">
                    <div className="flex flex-col gap-3">
                        {quickMessages.map((msg, index) => (
                            <button
                                key={index}
                                onClick={() => handleMessageClick(msg)}
                                className="w-full text-left p-3 bg-gray-700/50 rounded-lg hover:bg-gray-600/70 transition-colors"
                            >
                                {msg}
                            </button>
                        ))}
                    </div>
                </main>
            </div>
            <style>{`
                @keyframes slide-up-fast { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .animate-slide-up-fast { animation: slide-up-fast 0.25s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default QuickChatModal;
