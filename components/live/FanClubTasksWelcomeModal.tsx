
import React from 'react';
import { User } from '../../types';
import { BackIcon } from '../icons';

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

interface FanClubTasksWelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNext: () => void;
    streamer: User;
}

const FanClubTasksWelcomeModal: React.FC<FanClubTasksWelcomeModalProps> = ({ isOpen, onClose, onNext, streamer }) => {
    return (
        <div 
            className={`absolute inset-0 z-[102] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        >
          <div
            className={`absolute top-0 right-0 h-full w-full max-w-md bg-[#1C1C1E] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            onClick={e => e.stopPropagation()}
          >
                <header className="flex items-center p-4 border-b border-gray-700 flex-shrink-0">
                  <button onClick={onClose} className="text-gray-300 hover:text-white mr-4"><BackIcon className="w-6 h-6" /></button>
                  <h2 className="text-xl font-bold text-center flex-grow">Bem-vindo ao Fã-clube!</h2>
                </header>
                <main className="flex-grow overflow-y-auto p-6 text-center text-white no-scrollbar">
                    <p className="text-gray-400 mb-6">Complete tarefas diárias para aumentar seu nível de fã.</p>

                    <div className="space-y-3 text-left">
                        <TaskItem title="Assistir Transmissão ao Vivo" description="Ganhe 25 Pontos de Lealdade a cada 5 minutos" progress="0/100" color="#fca5a5" />
                        <TaskItem title="Envie uma mensagem" description="Ganhe 10 Pontos de Lealdade por mensagem" progress="0/120" color="#fca5a5" />
                        <TaskItem title="Compartilhar Transmissão" description="Ganhe 55 Pontos de Lealdade por compartilhamento" progress="0/110" color="#fca5a5" />
                    </div>
                </main>
                <footer className="p-4 flex-shrink-0 border-t border-gray-700 space-y-3">
                  <button
                      onClick={onNext}
                      className="w-full bg-purple-600 text-white font-bold py-3 rounded-full hover:bg-purple-700 transition-colors"
                  >
                      Ver Benefícios
                  </button>
                   <button
                      onClick={onClose}
                      className="w-full text-gray-400 font-semibold py-3 rounded-full hover:bg-white/10 transition-colors"
                  >
                      Fechar
                  </button>
                </footer>
          </div>
        </div>
    );
};

export default FanClubTasksWelcomeModal;
