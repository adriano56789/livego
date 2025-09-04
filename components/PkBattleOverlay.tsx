import React from 'react';
import type { PkBattleState } from '../types';
import PKClashIcon from './icons/PKClashIcon';

interface PkTimerProps {
  startTime: string;
  durationSeconds: number;
}

const PkTimer: React.FC<PkTimerProps> = ({ startTime, durationSeconds }) => {
    const calculateTimeLeft = React.useCallback(() => {
        const endTime = new Date(startTime).getTime() + durationSeconds * 1000;
        const difference = endTime - Date.now();
        if (difference <= 0) return { m: 0, s: 0 };

        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        return { m: minutes, s: seconds };
    }, [startTime, durationSeconds]);

    const [timeLeft, setTimeLeft] = React.useState(calculateTimeLeft());

    React.useEffect(() => {
        const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, [calculateTimeLeft]);

    return <span>{`${String(timeLeft.m).padStart(2, '0')}:${String(timeLeft.s).padStart(2, '0')}`}</span>;
};


interface PkBattleOverlayProps {
  battle: PkBattleState;
  streamer1Multiplier?: number;
  streamer2Multiplier?: number;
}

const PkBattleOverlay: React.FC<PkBattleOverlayProps> = ({ battle, streamer1Multiplier, streamer2Multiplier }) => {
    const totalScore = battle.pontuacao_A + battle.pontuacao_B;
    const streamer1Percent = totalScore > 0 ? (battle.pontuacao_A / totalScore) * 100 : 50;

    return (
        <div className="flex flex-col items-center gap-1 pointer-events-none text-white font-sans w-full px-4">
            {/* Score Bar */}
            <div className="relative h-6 w-full flex items-center">
                <span className="absolute left-2 font-bold text-lg drop-shadow-md">{battle.pontuacao_A}</span>
                <span className="absolute right-2 font-bold text-lg drop-shadow-md">{battle.pontuacao_B}</span>
                <div className="w-full h-2 rounded-full flex overflow-hidden bg-blue-400/30">
                    <div style={{ width: `${streamer1Percent}%` }} className="bg-yellow-400 rounded-l-full transition-all duration-500"></div>
                    <div style={{ width: `${100 - streamer1Percent}%` }} className="bg-blue-400 rounded-r-full transition-all duration-500"></div>
                </div>
            </div>

            {/* Timer and Win Badges Area */}
            <div className="relative w-full flex justify-center items-center h-8 -mt-2">
                {/* Left Win Badge */}
                <div className="absolute left-0">
                    <div className="bg-gray-900/60 text-yellow-300 font-bold text-xs px-3 py-1 rounded-full">
                        WIN <span className="font-sans">x</span>{streamer1Multiplier || 0}
                    </div>
                </div>

                {/* Timer */}
                <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold shadow-lg flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <PkTimer startTime={battle.data_inicio} durationSeconds={battle.duracao_segundos} />
                </div>

                {/* Right Win Badge */}
                <div className="absolute right-0">
                     <div className="bg-gray-900/60 text-yellow-300 font-bold text-xs px-3 py-1 rounded-full">
                        WIN <span className="font-sans">x</span>{streamer2Multiplier || 0}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PkBattleOverlay;