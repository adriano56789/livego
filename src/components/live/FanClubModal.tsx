

import React, { useState } from 'react';
import { User } from '../../types';
import { QuestionMarkIcon, FanBadgeIcon, EntryEffectIcon, GiftIcon, FanGroupSignIcon } from '../icons';

interface FanClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamer: User;
  isMember: boolean;
  onConfirmJoin: () => void;
  currentUser: User;
  // FIX: Add 'onOpenMembers' to the props interface
  onOpenMembers: (streamer: User) => void;
}

const TaskItem: React.FC<{title: string; description: string; progress: string; color: string;}> = ({title, description, progress, color}) => (
    <div className="bg-white/5 p-4 rounded-lg">
        <div className="flex justify-between items-center">
            <div>
                <p className="font-semibold text-white">{title}</p>
                <p className="text-sm text-gray-400 mt-1">{description}</p>
            </div>
            <p className={`font-semibold text-lg`} style={{color}}>{progress}</p>
        </div>
    </div>
);

const FanClubModal: React.FC<FanClubModalProps> = ({ isOpen, onClose, streamer, isMember, onConfirmJoin, currentUser, onOpenMembers }) => {
    const [activeTab, setActiveTab] = useState(isMember ? 'Benefícios' : 'Tarefas Diárias');

    if (!isOpen) return null;
    
  return (
    <div 
        className="absolute inset-0 z-50 flex items-end justify-center"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className={`relative w-full max-w-md transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        onClick={e => e.stopPropagation()}
      >
        <div 
          className="w-full rounded-t-3xl shadow-lg backdrop-blur-md text-gray-200" 
          style={{ backgroundColor: 'rgba(28, 28, 30, 0.9)' }}
        >
            <div className="pt-4 pb-4 px-4 relative text-center">
                <div 
                    className="absolute top-0 left-0 right-0 h-32" 
                    style={{ background: 'radial-gradient(circle at 50% 0%, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0) 70%)' }}
                ></div>
            
                <div className="relative">
                    <div className="flex flex-col items-center">
                      <div className="relative bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-1 rounded-full shadow-md mb-2">
                          <img src={streamer.avatarUrl} alt={streamer.name} className="w-16 h-16 rounded-full object-cover" />
                      </div>
                      <p className="text-lg font-bold text-white">
                        Fã-clube de {streamer.name} 🌹
                      </p>
                      {/* FIX: Use onOpenMembers for the button's onClick handler */}
                      <button onClick={() => onOpenMembers(streamer)} className="text-sm text-gray-400 mt-1 hover:underline">
                          Membros: {streamer.fans} >
                      </button>
                    </div>
                    <button className="absolute top-1 right-1 w-5 h-5 rounded-full border border-gray-500 flex items-center justify-center text-gray-500 text-xs font-bold hover:bg-gray-700">
                      <QuestionMarkIcon className="w-4 h-4"/>
                    </button>
                </div>
            </div>

            {isMember ? (
                <>
                    <div className="px-4 border-b border-gray-700/50">
                        <div className="flex items-center space-x-6">
                            <button onClick={() => setActiveTab('Tarefas Diárias')} className={`py-2 font-semibold ${activeTab === 'Tarefas Diárias' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>Tarefas Diárias</button>
                            <button onClick={() => setActiveTab('Benefícios')} className={`py-2 font-semibold ${activeTab === 'Benefícios' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>Benefícios</button>
                        </div>
                    </div>

                    <div className="p-4 space-y-3 max-h-[45vh] overflow-y-auto no-scrollbar">
                        {activeTab === 'Tarefas Diárias' ? (
                            <>
                                <TaskItem title="Assistir Transmissão ao Vivo" description="Ganhe 25 Pontos de Lealdade a cada 5 minutos" progress="100/100" color="#fca5a5" />
                                <TaskItem title="Envie uma mensagem para a tela pública da sala ao vivo" description="Ganhe 10 Pontos de Lealdade por mensagem" progress="120/120" color="#fca5a5" />
                                <TaskItem title="Compartilhar Transmissão ao Vivo" description="Ganhe 55 Pontos de Lealdade sempre que compartilhar." progress="0/110" color="#fca5a5" />
                            </>
                        ) : (
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-white text-center">Plaquinhas Evolucionárias</h3>
                                <p className="text-sm text-gray-400 text-center -mt-2 mb-4">Aumente seu nível de fã para desbloquear novas plaquinhas!</p>
                                
                                <div className="grid grid-cols-3 gap-3">
                                    {Array.from({ length: 20 }, (_, i) => i + 1).map(level => {
                                        const isUnlocked = currentUser.fanClub && currentUser.fanClub.level >= level;
                                        return (
                                            <div key={level} className={`flex flex-col items-center space-y-2 p-2 rounded-lg bg-white/5 transition-opacity duration-300 ${isUnlocked ? 'opacity-100' : 'opacity-60'}`}>
                                                <FanBadgeIcon level={level} streamerName={streamer.name} />
                                                <span className="text-xs text-gray-400">Nível {level}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        <div className="bg-white/5 p-4 rounded-lg flex items-center space-x-4 mt-4">
                            <img src={currentUser.avatarUrl} alt="Seu avatar" className="w-10 h-10 rounded-full" />
                            <div className="flex-grow">
                                <div className="flex justify-between items-center">
                                    <p className="text-white font-semibold">1755 Pontos de Lealdade</p>
                                    <FanBadgeIcon level={currentUser.fanClub?.level || 1} streamerName={streamer.name} />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">1000 mais Pontos de Lealdade são necessários. Você pode atualizar para desbloquear novos benefícios.</p>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="p-4 pt-0">
                         <p className="text-sm text-gray-400 text-center mb-4">Você pode obter privilégios:</p>
                        <div className="flex justify-around w-full">
                            <div className="flex flex-col items-center space-y-2 w-24">
                                <div className="w-14 h-14 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20">
                                <FanBadgeIcon level={1} streamerName={streamer.name} />
                                </div>
                                <span className="text-sm text-gray-300 leading-tight text-center">Distintivo de Fã</span>
                            </div>
                            <div className="flex flex-col items-center space-y-2 w-24">
                                <div className="w-14 h-14 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20">
                                <EntryEffectIcon level={1} streamerName={streamer.name} userName={currentUser.name} />
                                </div>
                                <span className="text-sm text-gray-300 leading-tight text-center">Efeitos de Entrada</span>
                            </div>
                            <div className="flex flex-col items-center space-y-2 w-24">
                                <div className="w-14 h-14 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20">
                                <GiftIcon className="w-7 h-7 text-purple-400" />
                                </div>
                                <span className="text-sm text-gray-300 leading-tight text-center">Presente do Fã-clube</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-700/50">
                        <button onClick={onConfirmJoin} className="w-full bg-[#FE397D] font-bold py-3.5 rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-pink-500/30 text-white text-lg">
                            Juntar-se
                        </button>
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default FanClubModal;