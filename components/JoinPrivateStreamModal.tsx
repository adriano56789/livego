
import React, { useState } from 'react';
import type { User, Stream, AppView } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import LockSolidIcon from './icons/LockSolidIcon';
import DiamondIcon from './icons/DiamondIcon';

interface JoinPrivateStreamModalProps {
  user: User;
  stream: Stream;
  onClose: () => void;
  onViewStream: (stream: Stream) => void;
  onUpdateUser: (user: User) => void;
  onNavigate: (view: AppView) => void;
}

const JoinPrivateStreamModal: React.FC<JoinPrivateStreamModalProps> = ({ user, stream, onClose, onViewStream, onUpdateUser, onNavigate }) => {
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if ((user.wallet_diamonds || 0) < (stream.entryFee || 0)) {
      onNavigate('diamond-purchase');
      return;
    }

    setIsPaying(true);
    setError(null);
    try {
      const updatedUser = await liveStreamService.payStreamEntryFee(user.id, stream.id);
      onUpdateUser(updatedUser);
      onViewStream(stream);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao entrar na live.");
      console.error(e);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 font-sans" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-[#2A0A4A] to-[#110E1E] w-full max-w-sm rounded-2xl p-6 text-center text-white flex flex-col items-center border border-purple-500/50 shadow-2xl animate-fade-in-fast"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-16 h-16 bg-purple-900/50 rounded-full flex items-center justify-center mb-4 border-2 border-purple-500/50">
          <LockSolidIcon className="w-8 h-8 text-purple-300" />
        </div>
        <h2 className="text-xl font-bold">Esta é uma live privada</h2>
        <p className="text-gray-300 mt-2">É necessária uma taxa de entrada para participar.</p>
        
        <div className="my-6 w-full bg-black/30 p-4 rounded-lg">
            <div className="flex justify-between items-center text-lg">
                <span className="text-gray-400">Taxa de Entrada</span>
                <div className="flex items-center gap-2 font-bold text-yellow-400">
                    <DiamondIcon className="w-6 h-6"/>
                    <span>{stream.entryFee || 'Grátis'}</span>
                </div>
            </div>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        
        <button
          onClick={handleConfirm}
          disabled={isPaying}
          className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-500 font-bold py-3.5 rounded-full text-lg transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
        >
          {isPaying && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
          {isPaying ? 'Entrando...' : 'Pagar e Entrar'}
        </button>
        <button onClick={onClose} className="mt-3 text-gray-400 font-semibold">
          Agora não
        </button>
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

export default JoinPrivateStreamModal;
