import React from 'react';
import { StreamSummaryData } from '../types';
import { BrazilFlagIcon } from './icons';

interface EndStreamSummaryScreenProps {
  data: StreamSummaryData;
  onClose: () => void;
}

const StatItem: React.FC<{ value: string | number; label: string; isPrimary?: boolean }> = ({ value, label, isPrimary = false }) => (
    <div className="text-center">
        <p className={`font-bold ${isPrimary ? 'text-5xl' : 'text-2xl'}`}>{value}</p>
        <p className="text-sm text-gray-400 mt-1">{label}</p>
    </div>
);

const EndStreamSummaryScreen: React.FC<EndStreamSummaryScreenProps> = ({ data, onClose }) => {
  const formatStat = (value: number) => (value > 0 ? `+${value}` : value);

  return (
    <div className="absolute inset-0 bg-[#111111] z-[60] flex flex-col items-center justify-around text-white p-8">
      <div>
        <h1 className="text-4xl font-bold text-center">A transmissão terminou.</h1>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="relative mb-4">
          <img 
            src={data.user.avatarUrl}
            alt={data.user.name}
            className="w-28 h-28 rounded-full object-cover border-4 border-white/50"
          />
          <div className="absolute -bottom-2 -right-2 bg-gray-800 rounded-full p-1 border-2 border-[#111111]">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
              <BrazilFlagIcon />
            </div>
          </div>
        </div>
        <p className="text-xl font-semibold">{data.user.name}</p>
      </div>

      <div className="w-full max-w-sm">
        <div className="space-y-8">
            <div className="flex justify-around items-start">
                <StatItem value={formatStat(data.viewers)} label="Número de espectadores" />
                <StatItem value={data.duration} label="Duração ao vivo" />
            </div>
            <div>
                <StatItem value={data.coins.toLocaleString('pt-BR')} label="Moedas" isPrimary />
            </div>
            <div className="flex justify-around items-start">
                <StatItem value={formatStat(data.followers)} label="Seguidores" />
                <StatItem value={formatStat(data.members)} label="Membro" />
                <StatItem value={formatStat(data.fans)} label="Fãs" />
            </div>
        </div>
      </div>
      
      <button 
        onClick={onClose}
        className="w-full max-w-sm bg-purple-600 hover:bg-purple-700 font-bold py-4 rounded-full transition-colors text-lg"
      >
        Voltar para a página inicial
      </button>
    </div>
  );
};

export default EndStreamSummaryScreen;