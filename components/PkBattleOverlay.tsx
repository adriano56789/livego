
import React from 'react';
import type { PkBattleState } from '../types';
import StarIcon from './icons/StarIcon';
import LightningIcon from './icons/LightningIcon';

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

    return <span>{`PK ${String(timeLeft.m).padStart(2, '0')}:${String(timeLeft.s).padStart(2, '0')}`}</span>;
};


interface PkBattleOverlayProps {
  battle: PkBattleState;
  streamer1WinMultiplier: number;
  streamer2WinMultiplier: number;
  isCoHost?: boolean;
}

const PkBattleOverlay: React.FC<PkBattleOverlayProps> = ({ battle, streamer1WinMultiplier, streamer2WinMultiplier, isCoHost }) => {
    const score1 = battle.pontuacao_A || 0;
    const score2 = battle.pontuacao_B || 0;
    const totalScore = score1 + score2;
    const score1Percent = totalScore > 0 ? (score1 / totalScore) * 100 : 50;

    return (
        <div className="flex flex-col gap-2 pointer-events-none text-white font-sans">
            {isCoHost ? (
                <div className="flex justify-center items-center mt-2">
                    <div className="bg-black/40 backdrop-blur-sm rounded-full px-5 py-2 font-semibold text-lg tracking-wider shadow-lg">
                        Co-apresentando
                    </div>
                </div>
            ) : (
                <>
                    {/* Top score bar */}
                    <div className="relative h-8 bg-black/30 rounded-full flex items-center p-1 backdrop-blur-sm">
                        <div className="absolute left-3 flex items-center gap-1 font-bold text-lg">
                            <StarIcon className="w-5 h-5 text-yellow-400" />
                            <span>{score1.toLocaleString()}</span>
                        </div>
                        <div className="absolute right-3 flex items-center gap-1 font-bold text-lg">
                            <span>{score2.toLocaleString()}</span>
                            <StarIcon className="w-5 h-5 text-yellow-400" />
                        </div>

                        <div className="w-full h-full flex rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-pink-500 to-rose-500 h-full" style={{ width: `${score1Percent}%` }}></div>
                            <div className="bg-gradient-to-l from-blue-500 to-cyan-400 h-full" style={{ width: `${100 - score1Percent}%` }}></div>
                        </div>

                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center border-2 border-black">
                            <LightningIcon className="w-5 h-5 text-black" />
                        </div>
                    </div>

                    {/* Middle info bar */}
                    <div className="flex justify-between items-center px-4 mt-2">
                        <div className="bg-black/40 backdrop-blur-sm rounded-full px-4 py-1.5 font-bold text-lg">
                            WIN &times; {streamer1WinMultiplier}
                        </div>
                        <div className="bg-pink-600 rounded-full px-5 py-2 font-black text-xl tracking-wider shadow-lg">
                            <PkTimer startTime={battle.data_inicio} durationSeconds={battle.duracao_segundos} />
                        </div>
                        <div className="bg-black/40 backdrop-blur-sm rounded-full px-4 py-1.5 font-bold text-lg">
                            WIN &times; {streamer2WinMultiplier}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default PkBattleOverlay;
