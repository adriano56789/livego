import React, { useState } from 'react';
import { CloseIcon, HelpIcon, CheckIcon, GiftIcon, ShieldIcon, ChevronRightIcon } from '../icons';
import { User } from '../../types';
import { LevelBadge } from '../LevelBadge';

interface FanClubModalProps {
    isOpen: boolean;
    onClose: () => void;
    streamer: User;
    isMember: boolean;
    currentUser: User;
    onConfirmJoin: () => void;
    onOpenMembers: (streamer: User) => void;
}

const FanClubModal: React.FC<FanClubModalProps> = ({ 
    isOpen, onClose, streamer, isMember, currentUser, onConfirmJoin, onOpenMembers 
}) => {
    const [activeTab, setActiveTab] = useState<'tasks' | 'benefits'>('tasks');

    if (!isOpen) return null;

    // Mock Data based on Screenshot 1
    const tasks = [
        { 
            id: 1, 
            title: 'Assistir Transmissão ao Vivo', 
            desc: 'Ganhe 25 Pontos de Lealdade a cada 5 minutos', 
            current: 100, 
            max: 100 
        },
        { 
            id: 2, 
            title: 'Envie uma mensagem para a tela pública da sala ao vivo', 
            desc: 'Ganhe 10 Pontos de Lealdade por mensagem', 
            current: 120, 
            max: 120 
        },
        { 
            id: 3, 
            title: 'Compartilhar Transmissão ao Vivo', 
            desc: 'Ganhe 55 Pontos de Lealdade sempre que compartilhar.', 
            current: 0, 
            max: 110 
        }
    ];

    // Levels Data for Benefits Tab
    const levels = Array.from({ length: 30 }, (_, i) => i + 1);

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-transparent" onClick={onClose}>
             <div 
                className="w-full bg-[#18181b] rounded-t-2xl h-[55vh] flex flex-col animate-in slide-in-from-bottom duration-300 relative shadow-2xl border-t border-white/5"
                onClick={e => e.stopPropagation()}
             >
                 {/* Top Gradient Overlay */}
                 <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#2e1065]/40 to-transparent rounded-t-2xl pointer-events-none"></div>

                 {/* Help Icon Top Right */}
                 <button className="absolute top-4 right-4 z-20 text-gray-400 hover:text-white bg-black/20 rounded-full p-1">
                     <HelpIcon className="w-5 h-5" />
                 </button>

                 {/* Header Info */}
                 <div className="flex flex-col items-center mt-6 mb-4 relative z-10 shrink-0">
                     <div className="relative mb-2">
                         <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 to-purple-600">
                            <img 
                                src={streamer.avatarUrl} 
                                alt={streamer.name} 
                                className="w-full h-full rounded-full object-cover border-[2px] border-[#18181b]" 
                            />
                         </div>
                     </div>
                     <h2 className="text-white font-bold text-base flex items-center gap-1.5">
                         Fã-clube de {streamer.name} <span className="text-red-500 text-xs">🌹</span>
                     </h2>
                     <p className="text-gray-500 text-[10px] mt-0.5 font-medium">Membros: {streamer.fans.toLocaleString()}</p>
                 </div>

                 {/* Tabs */}
                 <div className="flex px-4 relative z-10 border-b border-white/5 mx-4 shrink-0">
                     <button 
                        onClick={() => setActiveTab('tasks')}
                        className={`flex-1 pb-3 text-[14px] font-bold relative transition-colors ${activeTab === 'tasks' ? 'text-white' : 'text-gray-500'}`}
                     >
                         Tarefas Diárias
                         {activeTab === 'tasks' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-white rounded-full"></div>}
                     </button>
                     <button 
                        onClick={() => setActiveTab('benefits')}
                        className={`flex-1 pb-3 text-[14px] font-bold relative transition-colors ${activeTab === 'benefits' ? 'text-white' : 'text-gray-500'}`}
                     >
                         Benefícios
                         {activeTab === 'benefits' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-white rounded-full"></div>}
                     </button>
                 </div>

                 {/* Content Area */}
                 <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                     
                     {activeTab === 'tasks' && (
                         <div className="space-y-3 pb-20">
                             {tasks.map(task => {
                                 const isCompleted = task.current >= task.max;
                                 return (
                                     <div key={task.id} className="bg-[#232325] p-3 rounded-xl flex justify-between items-center border border-white/5">
                                         <div className="flex flex-col gap-1 pr-4 max-w-[75%]">
                                             <span className="text-white font-bold text-[12px] leading-tight">{task.title}</span>
                                             <span className="text-gray-500 text-[10px] leading-tight mt-0.5">{task.desc}</span>
                                         </div>
                                         <div className={`font-black text-xs whitespace-nowrap ${isCompleted ? 'text-[#ff4d6d]' : 'text-[#ff4d6d]'}`}>
                                             {task.current}/{task.max}
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                     )}

                     {activeTab === 'benefits' && (
                         <div className="pb-20">
                             <div className="p-6 space-y-6">
                                <div className="bg-purple-600/10 border border-purple-500/20 rounded-3xl p-5">
                                    <h3 className="text-purple-400 font-black text-sm mb-3 flex items-center gap-2">
                                        <ShieldIcon className="w-4 h-4" /> Benefícios de Membro
                                    </h3>
                                    <ul className="space-y-4">
                                        <li className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center shrink-0 text-[10px] font-bold">1</div>
                                            <p className="text-gray-300 text-xs leading-relaxed">Emblema exclusivo ao lado do nome em todas as lives deste streamer.</p>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center shrink-0 text-[10px] font-bold">2</div>
                                            <p className="text-gray-300 text-xs leading-relaxed">Mensagem de entrada personalizada ao entrar na sala.</p>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center shrink-0 text-[10px] font-bold">3</div>
                                            <p className="text-gray-300 text-xs leading-relaxed">Prioridade em pedidos de música e interação direta.</p>
                                        </li>
                                    </ul>
                                </div>
                                
                                <div className="text-center px-4 flex items-center justify-center gap-2">
                                     <GiftIcon className="w-4 h-4 text-gray-500" />
                                    <p className="text-gray-500 text-xs italic">"Ser um fã não é apenas dar presentes, é apoiar o talento e fazer parte da história."</p>
                                </div>
                            </div>
                         </div>
                     )}
                 </div>

                 {/* Sticky Footer */}
                 <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#18181b] border-t border-white/5 safe-area-bottom z-30">
                     {!isMember ? (
                         <button 
                            onClick={onConfirmJoin}
                            className="w-full bg-[#ff2d55] hover:bg-[#e01e45] text-white font-bold py-3.5 rounded-full transition-all text-sm shadow-lg shadow-pink-900/30 flex items-center justify-center gap-2"
                         >
                             Juntar-se (10 moedas) <ChevronRightIcon className="w-4 h-4 opacity-50" />
                         </button>
                     ) : (
                         <div className="flex items-center justify-between w-full cursor-pointer active:opacity-70 transition-opacity" onClick={() => onOpenMembers(streamer)}>
                             <div className="flex items-center gap-3">
                                 <img 
                                    src={streamer.avatarUrl} 
                                    className="w-10 h-10 rounded-full border border-white/10 object-cover" 
                                    alt="Streamer" 
                                 />
                                 <div className="flex flex-col">
                                     <span className="text-white font-bold text-[13px]">Ver membros do fã-clube</span>
                                     <span className="text-gray-500 text-[10px] leading-tight">Toque para ver o ranking completo.</span>
                                 </div>
                             </div>
                             <div className="flex items-center gap-1.5">
                                 <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                             </div>
                         </div>
                     )}
                 </div>
             </div>
        </div>
    );
}

export default FanClubModal;