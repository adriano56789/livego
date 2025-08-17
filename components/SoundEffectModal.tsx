import React from 'react';
import CrossIcon from './icons/CrossIcon';
import type { SoundEffectName } from '../types';

import LaughterIcon from './icons/LaughterIcon';
import ApplauseIcon from './icons/ApplauseIcon';
import CheerIcon from './icons/CheerIcon';
import KissIcon from './icons/KissIcon';
import WeirdFaceIcon from './icons/WeirdFaceIcon';
import WrongAnswerIcon from './icons/WrongAnswerIcon';
import SmileyFaceIcon from './icons/SmileyFaceIcon';

interface SoundEffectModalProps {
  onClose: () => void;
  onPlaySoundEffect: (effectName: SoundEffectName) => void;
}

const SoundEffectButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
    <button 
        className="flex flex-col items-center justify-start gap-2 text-center"
        onClick={onClick}
    >
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center transition-transform hover:scale-110">
            {icon}
        </div>
        <span className="text-sm text-gray-700 font-medium">{label}</span>
    </button>
);

const SoundEffectModal: React.FC<SoundEffectModalProps> = ({ onClose, onPlaySoundEffect }) => {
    const iconClass = "w-9 h-9 text-gray-800";
    
    const soundEffects: { icon: React.ReactNode; label: string; name: SoundEffectName }[] = [
        { icon: <LaughterIcon className={iconClass} />, label: 'Riso', name: 'riso' },
        { icon: <ApplauseIcon className={iconClass} />, label: 'Aplausos', name: 'aplausos' },
        { icon: <CheerIcon className={iconClass} />, label: 'Animar', name: 'animar' },
        { icon: <KissIcon className={iconClass} />, label: 'Beijar', name: 'beijar' },
        { icon: <WeirdFaceIcon className={iconClass} />, label: 'Estranho', name: 'estranho' },
        { icon: <WrongAnswerIcon className={iconClass} />, label: 'Resposta errada', name: 'resposta_errada' },
        { icon: <SmileyFaceIcon className={iconClass} />, label: 'Sorriso', name: 'sorriso' },
    ];

    return (
        <div 
          className="fixed inset-0 bg-transparent z-50 flex items-end"
          onClick={onClose}
        >
          <div 
            className="bg-white w-full rounded-t-2xl flex flex-col text-black animate-slide-up-fast"
            onClick={e => e.stopPropagation()}
          >
            <header className="p-4 flex items-center justify-center relative shrink-0 border-b border-gray-200">
                <h2 className="font-semibold text-lg">Efeito sonoro</h2>
                <button onClick={onClose} className="absolute top-1/2 -translate-y-1/2 right-4">
                    <CrossIcon className="w-6 h-6 text-gray-400" />
                </button>
            </header>
            <main className="p-6">
                <div className="grid grid-cols-4 gap-x-4 gap-y-6">
                    {soundEffects.map(effect => (
                        <SoundEffectButton 
                            key={effect.label} 
                            icon={effect.icon}
                            label={effect.label}
                            onClick={() => onPlaySoundEffect(effect.name)}
                        />
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

export default SoundEffectModal;