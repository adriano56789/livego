import React from 'react';
import type { LiveEndSummary } from '../types';
import BrazilFlagIcon from './icons/BrazilFlagIcon';

interface LiveEndedScreenProps {
  summary: LiveEndSummary;
  onExit: () => void;
}

const StatItem: React.FC<{ value: string | number; label: string }> = ({ value, label }) => (
  <div className="text-center">
    <p className="text-white font-bold text-2xl">{`+${value}`}</p>
    <p className="text-gray-400 text-sm mt-1">{label}</p>
  </div>
);

// Special stat for duration without the '+'
const StatItemDuration: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="text-center">
    <p className="text-white font-bold text-2xl">{value}</p>
    <p className="text-gray-400 text-sm mt-1">{label}</p>
  </div>
);

const LiveEndedScreen: React.FC<LiveEndedScreenProps> = ({ summary, onExit }) => {
  
  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
      .map(v => v.toString().padStart(2, '0'))
      .join(':');
  };

  return (
    <div className="h-screen w-full text-white flex flex-col font-sans relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#2A0A4A] via-[#1C0F32] to-[#110E1E] z-0"></div>
      
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-3xl font-bold">A transmissão terminou.</h1>
        
        <div className="my-8 flex flex-col items-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 p-1">
                <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-5xl font-bold">
                    {summary.streamerAvatarUrl ? (
                         <img src={summary.streamerAvatarUrl} alt={summary.streamerName || 'Streamer'} className="w-full h-full object-cover rounded-full" />
                    ) : (
                        (summary.streamerName || '').substring(0, 1).toUpperCase()
                    )}
                </div>
            </div>
            <BrazilFlagIcon className="w-8 h-8 absolute bottom-0 right-0" />
          </div>
          <h2 className="text-xl font-bold mt-4">{summary.streamerName}</h2>
        </div>

        <div className="w-full max-w-md grid grid-cols-3 gap-y-6">
          <StatItem value={summary.peakViewers} label="Número de espectadores" />
          <StatItemDuration value={formatDuration(summary.durationSeconds)} label="Duração ao vivo" />
          <StatItem value={(summary.totalEarnings || 0).toLocaleString()} label="Moedas" />
          <StatItem value={summary.newFollowers} label="Seguidores" />
          <StatItem value={summary.newMembers} label="Membro" />
          <StatItem value={summary.newFans} label="Fãs" />
        </div>
      </main>

      <footer className="relative z-10 p-4 shrink-0">
        <button
          onClick={onExit}
          className="w-full max-w-md mx-auto bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white font-bold py-4 rounded-full text-lg"
        >
          Voltar a página inicial
        </button>
      </footer>
    </div>
  );
};

export default LiveEndedScreen;