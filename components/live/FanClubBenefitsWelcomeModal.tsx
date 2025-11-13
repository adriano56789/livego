
import React from 'react';
import { User } from '../../types';
import { FanBadgeIcon, EntryEffectIcon, FanGroupSignIcon, BackIcon } from '../icons';

const BenefitItem: React.FC<{ description: string, visual: React.ReactNode }> = ({ description, visual }) => (
    <div className="bg-white/5 p-3 rounded-lg flex justify-between items-center">
        <p className="font-semibold text-white text-sm">{description}</p>
        <div className="flex-shrink-0 ml-4">
            {visual}
        </div>
    </div>
);

interface FanClubBenefitsWelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    streamer: User;
    currentUser: User;
}

const FanClubBenefitsWelcomeModal: React.FC<FanClubBenefitsWelcomeModalProps> = ({ isOpen, onClose, streamer, currentUser }) => {

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
                  <h2 className="text-xl font-bold text-center flex-grow">Seus Benefícios de Fã!</h2>
                </header>
                <main className="flex-grow overflow-y-auto p-6 text-center text-white no-scrollbar">
                  <p className="text-gray-400 mb-6">Aproveite privilégios exclusivos por apoiar {streamer.name}.</p>

                  <div className="space-y-2 text-left">
                       <BenefitItem 
                          description="Distintivo Básico Iluminado" 
                          visual={<FanBadgeIcon level={1} streamerName={streamer.name} />} 
                      />
                      <BenefitItem 
                          description="Obtenha os efeitos de entrada básicos." 
                          visual={<EntryEffectIcon level={1} streamerName={streamer.name} userName={currentUser.name} />} 
                      />
                      <BenefitItem 
                          description="Desbloqueou o presente sinal de luz do ventilador" 
                          visual={<div className="scale-75"><FanGroupSignIcon /></div>} 
                      />
                  </div>
                </main>
                <footer className="p-4 flex-shrink-0 border-t border-gray-700">
                  <button
                      onClick={onClose}
                      className="w-full bg-purple-600 text-white font-bold py-3 rounded-full hover:bg-purple-700 transition-colors"
                  >
                      Entendi
                  </button>
                </footer>
            </div>
        </div>
    );
};

export default FanClubBenefitsWelcomeModal;
