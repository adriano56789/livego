import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon, ImageIcon, SendIcon, MoreIcon, CloseIcon } from '../icons';
import { User, ToastType } from '../../types';

interface PrivateChatScreenProps {
    user: User;
    onClose: () => void;
    variant?: 'page' | 'modal';
    onBlock?: (user: User) => void;
    addToast: (type: ToastType, message: string) => void;
}

interface Message {
    id: number;
    text: string;
    isMe: boolean;
    timestamp: number;
}

const ReportModal = ({ isOpen, onClose, onReport }: { isOpen: boolean; onClose: () => void; onReport: (reason: string) => void; }) => {
    if (!isOpen) return null;
    const reasons = ["Conteúdo sexualmente explícito", "Discurso de ódio", "Assédio ou bullying", "Violência perigosa", "Spam ou golpe", "Outro"];
    
    return (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/40" onClick={onClose}>
            <div className="w-full bg-[#1C1C1E] rounded-t-3xl animate-in slide-in-from-bottom duration-300 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-white/5">
                    <h3 className="text-white font-bold text-center">Denunciar Usuário</h3>
                </div>
                <div className="flex flex-col pb-8">
                    {reasons.map((reason, idx) => (
                        <button key={idx} onClick={() => onReport(reason)} className="w-full py-4 text-center text-white text-sm border-b border-white/5">{reason}</button>
                    ))}
                    <button onClick={onClose} className="w-full py-4 text-center text-gray-500 font-bold text-sm mt-2">Cancelar</button>
                </div>
            </div>
        </div>
    );
};

const PrivateChatScreen: React.FC<PrivateChatScreenProps> = ({ user, onClose, variant = 'modal', onBlock, addToast }) => {
    const [messageText, setMessageText] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Carregamento de mensagens iniciais estáticas (sem API)
    useEffect(() => {
        const initialMsgs: Message[] = [
            {
                id: 1,
                text: `Olá! Sou ${user.name}. Como você está?`,
                isMe: false,
                timestamp: Date.now() - 100000
            }
        ];
        
        if (user.id === 'support-livercore') {
            initialMsgs.push({
                id: 2,
                text: "Bem-vindo à plataforma LiveGo! Estamos aqui para ajudar com qualquer dúvida sobre diamantes, saques ou transmissões.",
                isMe: false,
                timestamp: Date.now() - 50000
            });
        }

        setMessages(initialMsgs);
    }, [user.id, user.name]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = () => {
        if (!messageText.trim()) return;

        const newMessage: Message = {
            id: Date.now(),
            text: messageText.trim(),
            isMe: true,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, newMessage]);
        setMessageText('');
        
        // Simulação de resposta automática simples
        if (user.id === 'support-livercore') {
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    text: "Entendi! Um de nossos atendentes analisará sua solicitação em breve. Obrigado pela paciência!",
                    isMe: false,
                    timestamp: Date.now()
                }]);
            }, 1500);
        }
    };

    const handleReport = (reason: string) => {
        setIsReportModalOpen(false);
        addToast(ToastType.Success, `Denúncia sobre "${reason}" enviada.`);
    };

    const containerClasses = variant === 'page' 
        ? "fixed inset-0 z-[130] bg-[#121212] flex flex-col" 
        : "fixed inset-0 z-[130] flex items-end justify-center bg-transparent";

    const contentClasses = variant === 'page'
        ? "w-full h-full flex flex-col"
        : "w-full h-[60%] bg-[#1C1C1E] rounded-t-[32px] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 border-t border-white/5 overflow-hidden";

    return (
        <div className={containerClasses} onClick={variant === 'modal' ? onClose : undefined}>
            <div className={contentClasses} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 bg-[#121212]/50 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors">
                            <ChevronLeftIcon className="w-6 h-6 text-white" />
                        </button>
                        <div className="relative">
                            <img src={user.avatarUrl} className="w-10 h-10 rounded-full object-cover border border-white/10" alt={user.name} />
                            {user.isOnline && (
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00E676] rounded-full border-2 border-[#121212]"></div>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-white font-black text-sm leading-tight tracking-wide">{user.name}</h1>
                            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-tighter">
                                {user.isOnline ? 'Online' : 'Visto recentemente'}
                            </span>
                        </div>
                    </div>
                    
                    <button onClick={() => setIsOptionsOpen(true)} className="p-2 text-gray-400 hover:text-white transition-colors">
                        <MoreIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Chat Body */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-[#121212]">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1`}>
                            <div className={`max-w-[80%] px-4 py-2.5 text-sm font-medium shadow-md ${
                                msg.isMe 
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl rounded-tr-none' 
                                    : 'bg-[#2C2C2E] text-white rounded-2xl rounded-tl-none'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-3 pb-8 border-t border-white/5 bg-[#1C1C1E] shrink-0">
                    <div className="flex items-center gap-2">
                         <button className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                            <ImageIcon className="w-5 h-5" />
                         </button>
                         <div className="flex-1 bg-white/5 rounded-full flex items-center px-4 py-1 border border-white/5 focus-within:border-white/20 transition-all">
                            <input 
                                type="text" 
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Diga algo legal..."
                                className="flex-1 bg-transparent text-white text-sm outline-none py-2.5 placeholder-gray-600"
                            />
                         </div>
                         <button 
                            onClick={handleSendMessage}
                            disabled={!messageText.trim()}
                            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                                messageText.trim() ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' : 'bg-white/5 text-gray-600'
                            }`}
                        >
                            <SendIcon className="w-5 h-5 ml-0.5" />
                         </button>
                    </div>
                </div>
            </div>
            
            {/* Options Modal Placeholder */}
            {isOptionsOpen && (
                <div className="fixed inset-0 z-[140] flex items-end justify-center" onClick={() => setIsOptionsOpen(false)}>
                    <div className="w-full bg-[#1C1C1E] rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom duration-300 border-t border-white/10 shadow-2xl">
                        <div className="flex flex-col p-2 pb-10">
                            <button onClick={() => { setIsOptionsOpen(false); onBlock && onBlock(user); }} className="w-full py-4 text-center text-red-500 font-black text-sm border-b border-white/5 uppercase tracking-widest">Bloquear Usuário</button>
                            <button onClick={() => { setIsOptionsOpen(false); setIsReportModalOpen(true); }} className="w-full py-4 text-center text-white font-black text-sm border-b border-white/5 uppercase tracking-widest">Denunciar</button>
                            <button onClick={() => setIsOptionsOpen(false)} className="w-full py-4 text-center text-gray-500 font-black text-sm uppercase tracking-widest">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onReport={handleReport} />
        </div>
    );
};

export default PrivateChatScreen;