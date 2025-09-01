import React, { useState, useEffect } from 'react';
import type { TopFanDetails } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';
import Flag from './Flag';
import DiamondIcon from './icons/DiamondIcon';

interface TopFansScreenProps {
  viewedUserId: number;
  onExit: () => void;
}

const RankOneBadge: React.FC = () => (
    <div className="relative w-8 h-10 flex-shrink-0">
        <svg viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M0 4C0 1.79086 1.79086 0 4 0H28C30.2091 0 32 1.79086 32 4V34.5L16 40L0 34.5V4Z" fill="#A855F7"/>
            <path d="M0 34.5L16 40L32 34.5V36.5L16 42L0 36.5V34.5Z" fill="#6D28D9" fillOpacity="0.5"/>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl -mt-2 drop-shadow-sm">1</span>
    </div>
);

const FanRow: React.FC<{ fan: TopFanDetails }> = ({ fan }) => {
    return (
        <div className="flex items-center gap-4 py-3">
            {fan.rank === 1 ? <RankOneBadge /> : <div className="w-8 text-center font-bold text-lg text-gray-400 flex-shrink-0">{fan.rank}</div>}
            
            <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full bg-gray-700 overflow-hidden border-2 border-gray-700">
                    {fan.avatarUrl ? <img src={fan.avatarUrl} alt={fan.name} className="w-full h-full object-cover" /> : <UserPlaceholderIcon className="w-full h-full p-2 text-gray-400"/>}
                </div>
                {fan.country && <Flag code={fan.country} className="absolute bottom-0 -right-1 w-6 h-auto rounded-full border-2 border-[#1C1F24]" />}
            </div>

            <p className="flex-grow font-semibold text-white truncate">{fan.name}</p>

            <div className="flex items-center gap-1.5 shrink-0">
                <DiamondIcon className="w-5 h-5" />
                <span className="font-bold text-yellow-500">{fan.contribution.toLocaleString()}</span>
            </div>
        </div>
    );
};

const TopFansScreen: React.FC<TopFansScreenProps> = ({ viewedUserId, onExit }) => {
  const [fans, setFans] = useState<TopFanDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await liveStreamService.getTopFans(viewedUserId);
        setFans(data);
      } catch (error) {
        console.error("Failed to load top fans data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [viewedUserId]);

  return (
    <div className="h-screen w-full bg-[#1C1F24] text-white flex flex-col font-sans">
      <header className="p-4 flex items-center justify-between shrink-0 relative border-b border-gray-800">
        <button onClick={onExit} className="p-2 -m-2 z-10"><ArrowLeftIcon className="w-6 h-6"/></button>
        <h1 className="font-bold text-lg absolute left-1/2 -translate-x-1/2">Top Fãs</h1>
        <div className="w-6"></div>
      </header>

      <main className="flex-grow p-2 overflow-y-auto scrollbar-hide">
        {isLoading ? (
            <div className="flex justify-center items-center h-full">
                <div className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
        ) : fans.length > 0 ? (
            <div className="divide-y divide-gray-800">
                {fans.map(fan => <FanRow key={fan.userId} fan={fan} />)}
            </div>
        ) : (
            <div className="text-center text-gray-500 pt-20">
                <p>Nenhum fã encontrado.</p>
                <p className="text-sm mt-1">Envie presentes para se tornar um top fã!</p>
            </div>
        )}
      </main>
    </div>
  );
};

export default TopFansScreen;
