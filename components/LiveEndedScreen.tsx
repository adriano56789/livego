import React, { useState } from 'react';
import type { LiveEndSummary } from '../types';
import ClockIcon from './icons/ClockIcon';
import ViewersIcon from './icons/ViewersIcon';
import DiamondIcon from './icons/DiamondIcon';
import HeartSolidIcon from './icons/HeartSolidIcon';

interface LiveEndedScreenProps {
  summary: LiveEndSummary;
  isFollowing: boolean;
  onExit: () => void;
  onFollowToggle: (userId: number) => void;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="bg-[#1c1c1c]/80 backdrop-blur-sm p-4 rounded-lg text-center">
    <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
      {icon}
      <span>{label}</span>
    </div>
    <p className="text-white font-bold text-xl mt-1">{value}</p>
  </div>
);

const ContributorRow: React.FC<{ user: LiveEndSummary['topContributors'][0] }> = ({ user }) => (
  <div className="flex items-center gap-3 p-2 bg-[#1c1c1c]/50 rounded-lg">
    <span className="font-bold text-lg text-yellow-400 w-6 text-center">{user.rank}</span>
    <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
    <p className="flex-grow font-semibold text-white truncate">{user.name}</p>
    <div className="flex items-center gap-1.5 text-yellow-400 font-semibold text-sm">
      <DiamondIcon className="w-4 h-4" />
      <span>{user.contribution.toLocaleString('pt-BR')}</span>
    </div>
  </div>
);

const LiveEndedScreen: React.FC<LiveEndedScreenProps> = ({ summary, isFollowing, onExit, onFollowToggle }) => {
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const handleFollow = async () => {
    setIsFollowLoading(true);
    try {
      await onFollowToggle(summary.streamerId);
    } catch (error) {
      console.error("Follow toggle failed on LiveEndedScreen:", error);
      alert(`Ocorreu um erro: ${error instanceof Error ? error.message : 'Tente novamente.'}`);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
      .map(v => v.toString().padStart(2, '0'))
      .join(':');
  };

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
      <div className="absolute inset-0 z-0">
        <img src={summary.streamerAvatarUrl} alt="Streamer background" className="w-full h-full object-cover opacity-20 blur-lg" />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 to-black"></div>
      </div>

      <main className="relative z-10 flex-grow flex flex-col items-center p-4 overflow-y-auto">
        <h1 className="text-2xl font-bold mt-8">Transmissão Encerrada</h1>
        
        <div className="flex flex-col items-center my-6">
          <img src={summary.streamerAvatarUrl} alt={summary.streamerName} className="w-24 h-24 rounded-full object-cover border-4 border-gray-700" />
          <h2 className="text-xl font-bold mt-3">{summary.streamerName}</h2>
          <button 
            onClick={handleFollow}
            disabled={isFollowLoading}
            className={`mt-3 px-6 py-2 rounded-full font-semibold text-sm transition-colors ${isFollowing ? 'bg-gray-700 text-gray-300' : 'bg-green-500 text-black'} disabled:opacity-50 disabled:cursor-wait`}
          >
            {isFollowLoading ? 'Aguarde...' : (isFollowing ? 'Seguindo' : 'Seguir')}
          </button>
        </div>

        <div className="w-full max-w-md grid grid-cols-3 gap-3">
          <StatCard icon={<ClockIcon className="w-5 h-5" />} label="Duração" value={formatDuration(summary.durationSeconds)} />
          <StatCard icon={<ViewersIcon className="w-5 h-5" />} label="Pico de Espectadores" value={summary.peakViewers.toLocaleString('pt-BR')} />
          <StatCard icon={<DiamondIcon className="w-5 h-5" />} label="Ganhos" value={summary.totalEarnings.toLocaleString('pt-BR')} />
        </div>

        {summary.topContributors.length > 0 && (
          <div className="w-full max-w-md mt-8">
            <h3 className="font-semibold text-center mb-3">Principais Contribuintes</h3>
            <div className="space-y-2">
              {summary.topContributors.map(contributor => (
                <ContributorRow key={contributor.userId} user={contributor} />
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 p-4 shrink-0">
        <button
          onClick={onExit}
          className="w-full max-w-md mx-auto bg-green-500 text-black font-bold py-4 rounded-full text-lg"
        >
          Voltar para o Feed
        </button>
      </footer>
    </div>
  );
};

export default LiveEndedScreen;