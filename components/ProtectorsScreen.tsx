
import React, { useState, useEffect } from 'react';
import type { User, ProtectorDetails } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import * as authService from '../services/authService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import QuestionMarkIcon from './icons/QuestionMarkIcon';
import PodiumCrownIcon from './icons/PodiumCrownIcon';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';
import JellyfishIcon from './icons/JellyfishIcon';
import WaveIcon from './icons/WaveIcon';

interface ProtectorsScreenProps {
  streamerId: number;
  onExit: () => void;
}

const formatValue = (value: number) => value.toLocaleString('pt-BR');

const ProtectorsScreen: React.FC<ProtectorsScreenProps> = ({ streamerId, onExit }) => {
  const [streamer, setStreamer] = useState<User | null>(null);
  const [protectors, setProtectors] = useState<ProtectorDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [streamerData, protectorsData] = await Promise.all([
          authService.getUserProfile(streamerId),
          liveStreamService.getProtectorsList(streamerId),
        ]);
        setStreamer(streamerData);
        setProtectors(protectorsData);
      } catch (error) {
        console.error("Failed to load protectors data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [streamerId]);

  const renderNickname = (nickname: string) => {
    const name = nickname.replace(/🐍|🌊/g, '').trim();
    return (
        <span className="font-bold text-lg flex items-center gap-1.5">
            <span>{name}</span>
            {nickname.includes('🐍') && <JellyfishIcon className="w-5 h-5 text-cyan-400" />}
            {nickname.includes('🌊') && <WaveIcon className="w-5 h-5 text-blue-400" />}
        </span>
    );
  };

  const TopProtector: React.FC<{ user: ProtectorDetails }> = ({ user }) => (
    <div className="bg-gradient-to-br from-gray-800 to-black/50 border border-yellow-500/30 rounded-2xl p-4 flex flex-col items-center text-center shadow-lg my-4">
        <div className="relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                <PodiumCrownIcon className="w-12 h-12" />
            </div>
            <div className="w-20 h-20 rounded-full border-2 border-yellow-400 bg-gray-700 flex items-center justify-center overflow-hidden">
                {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                    <UserPlaceholderIcon className="w-12 h-12 text-gray-400"/>
                )}
            </div>
        </div>
        <p className="font-bold text-lg text-white mt-2">{user.name}</p>
        <p className="text-sm text-gray-400">Proteção: <span className="text-yellow-400 font-semibold">{formatValue(user.protectionValue)}</span></p>
    </div>
  );

  const ProtectorRow: React.FC<{ user: ProtectorDetails }> = ({ user }) => (
    <div className="flex items-center gap-4 py-2">
        <span className="w-8 text-center font-bold text-lg text-gray-400">{user.rank}</span>
        <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
             {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
                <UserPlaceholderIcon className="w-8 h-8 text-gray-400"/>
            )}
        </div>
        <p className="flex-grow font-semibold text-white">{user.name}</p>
        <p className="text-gray-300">{formatValue(user.protectionValue)}</p>
    </div>
  );

  if (isLoading || !streamer) {
    return (
      <div className="h-screen w-full bg-[#121212] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const topProtector = protectors.find(p => p.rank === 1);
  const otherProtectors = protectors.filter(p => p.rank > 1);

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
        <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-800">
            <button onClick={onExit}><ArrowLeftIcon className="w-6 h-6"/></button>
            <h1 className="font-bold text-lg">Proteger</h1>
            <button><QuestionMarkIcon className="w-6 h-6"/></button>
        </header>

        <main className="flex-grow p-4 overflow-y-auto">
            <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                    <img src={streamer.avatar_url} alt={streamer.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                        <p className="text-sm text-gray-400">Valor de proteção para</p>
                        {renderNickname(streamer.nickname || streamer.name)}
                    </div>
                </div>
                <button className="bg-pink-600 text-white font-semibold text-sm px-5 py-2 rounded-full hover:bg-pink-700 transition-colors">
                    Proteja
                </button>
            </div>
            
            <p className="text-sm text-center text-gray-500 my-3">0</p>

            {topProtector && <TopProtector user={topProtector} />}

            <div className="flex flex-col">
                {otherProtectors.map(p => <ProtectorRow key={p.userId} user={p} />)}
            </div>
        </main>
    </div>
  );
};

export default ProtectorsScreen;
