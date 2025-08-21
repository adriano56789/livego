import React from 'react';
import CrossIcon from './icons/CrossIcon';
import LinkedCirclesIcon from './icons/LinkedCirclesIcon';
import SwordsIcon from './icons/SwordsIcon';

interface PkModeSelectionModalProps {
  onClose: () => void;
  onSelectInviteFriends: () => void;
  onSelectRandomMatch: () => void;
}

const PkModeSelectionModal: React.FC<PkModeSelectionModalProps> = ({
  onClose,
  onSelectInviteFriends,
  onSelectRandomMatch,
}) => {
  return (
    <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4 font-sans" onClick={onClose}>
      <div
        className="bg-[#1c1c1e] rounded-2xl w-full max-w-sm animate-fade-in-fast p-6 flex flex-col items-center"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
          <CrossIcon className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold text-white mb-6">Iniciar Disputa</h2>

        <div className="w-full space-y-4">
          <button
            onClick={onSelectInviteFriends}
            className="w-full flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-600/70 transition-colors"
          >
            <LinkedCirclesIcon className="w-12 h-12" />
            <div>
              <p className="font-semibold text-base text-left text-white">+ Hosts</p>
              <p className="text-sm text-left text-gray-400">Batalhe com streamers que você segue.</p>
            </div>
          </button>

          <button
            onClick={onSelectRandomMatch}
            className="w-full flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-600/70 transition-colors"
          >
            <SwordsIcon className="w-12 h-12 p-2" />
            <div>
              <p className="font-semibold text-base text-left text-white">Matchmaking Aleatório</p>
              <p className="text-sm text-left text-gray-400">Encontre um oponente do seu nível.</p>
            </div>
          </button>
        </div>
      </div>
       <style>{`
        @keyframes fade-in-fast {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default PkModeSelectionModal;
