import React from 'react';
import type { TabelaRankingApoiadores, PkBattleStreamer } from '../types';
import CrossIcon from './icons/CrossIcon';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';
import PodiumCrownIcon from './icons/PodiumCrownIcon';

interface PkRankingModalProps {
  supporters: TabelaRankingApoiadores[];
  streamer: PkBattleStreamer;
  onClose: () => void;
  onUserClick: (userId: number) => void;
}

const SupporterRow: React.FC<{ supporter: TabelaRankingApoiadores; rank: number; onUserClick: (userId: number) => void }> = ({ supporter, rank, onUserClick }) => (
    <button onClick={() => onUserClick(supporter.apoiador_id)} className="flex items-center gap-3 p-2 rounded-lg w-full hover:bg-white/5 transition-colors">
        <div className="w-10 text-center font-bold text-lg">
            {rank === 1 ? <PodiumCrownIcon className="w-8 h-8 mx-auto text-yellow-400" /> : rank}
        </div>
        <img src={supporter.avatar_url} alt={supporter.name} className="w-12 h-12 rounded-full object-cover" />
        <p className="flex-grow font-semibold text-white text-left truncate">{supporter.name}</p>
        <p className="font-bold text-yellow-400">{(supporter.total_pontos_enviados || 0).toLocaleString()}</p>
    </button>
);


const PkRankingModal: React.FC<PkRankingModalProps> = ({ supporters, streamer, onClose, onUserClick }) => {
    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={onClose}>
            <div 
                className="bg-[#1C1F24] w-full h-[60vh] rounded-t-2xl flex flex-col text-white animate-slide-up-fast"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 flex items-center justify-between border-b border-white/10 shrink-0">
                    <div className="w-6 h-6"></div>
                    <h2 className="text-lg font-bold text-center">Ranking de Apoiadores<br/><span className="text-sm text-gray-400 font-normal">Para {streamer.name}</span></h2>
                    <button onClick={onClose}><CrossIcon className="w-6 h-6 text-gray-400" /></button>
                </header>

                <main className="flex-grow overflow-y-auto p-2">
                    {supporters && supporters.length > 0 ? (
                        <div className="divide-y divide-gray-800">
                           {supporters.map((supporter, index) => (
                                <SupporterRow 
                                    key={supporter.apoiador_id}
                                    supporter={supporter}
                                    rank={index + 1}
                                    onUserClick={onUserClick}
                                />
                           ))}
                        </div>
                    ) : (
                         <div className="text-center text-gray-500 pt-20">
                            <p>Nenhum apoiador ainda.</p>
                            <p className="text-sm mt-1">Envie presentes para aparecer aqui!</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default PkRankingModal;