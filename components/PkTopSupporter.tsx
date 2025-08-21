
import React from 'react';
import type { TabelaRankingApoiadores } from '../types';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';

interface PkTopSupporterProps {
  supporter: TabelaRankingApoiadores;
  onUserClick: (userId: number) => void;
}

const PkTopSupporter: React.FC<PkTopSupporterProps> = ({ supporter, onUserClick }) => {
  return (
    <button
      onClick={() => onUserClick(supporter.apoiador_id)}
      className="w-10 h-10 rounded-full border-2 border-yellow-400 bg-gray-700 overflow-hidden shadow-lg transition-transform hover:scale-110"
      title={`Top supporter: ${supporter.total_pontos_enviados} points`}
    >
      {supporter.avatar_url ? (
        <img src={supporter.avatar_url} alt="Top supporter" className="w-full h-full object-cover" />
      ) : (
        <UserPlaceholderIcon className="w-full h-full text-gray-400 p-1" />
      )}
    </button>
  );
};

export default PkTopSupporter;
